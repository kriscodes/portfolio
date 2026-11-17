import assert from 'node:assert/strict';
import test from 'node:test';
import { compileRule, flatten, initialRule, moveNode, orders, removeNode, updateNode, validateRule, type Group } from './rule-model';

test('nested AND/OR preview distinguishes matches from partial matches', () => {
  assert.deepEqual(orders.filter(compileRule(initialRule())).map(row => row.id), ['DEMO-01', 'DEMO-03', 'DEMO-04', 'DEMO-08']);
  const all = updateNode(initialRule(), 'segment', node => ({ ...node, mode: 'all' }));
  assert.deepEqual(orders.filter(compileRule(all)), []);
});
test('blank amounts, negative amounts, and empty groups block execution', () => {
  for (const value of ['', ' ', '-1', 'NaN', 'Infinity']) {
    const invalid = updateNode(initialRule(), 'total', node => ({ ...node, value }));
    assert.ok(validateRule(invalid).some(error => error.id === 'total'));
    assert.throws(() => compileRule(invalid));
  }
  const empty = removeNode(removeNode(initialRule(), 'west'), 'partner');
  assert.ok(validateRule(empty).some(error => error.id === 'segment'));
  assert.throws(() => compileRule(empty));
});
test('zero is a valid amount and equality is numeric', () => {
  const root = { id: 'root', kind: 'group', mode: 'all', children: [{ id: 'zero', kind: 'condition', field: 'amount', operator: 'eq', value: '0' }] } as Group;
  assert.equal(compileRule(root)({ id: 'zero', amount: 0, region: 'West', channel: 'Store' }), true);
});
test('group moves reject cycles, missing targets, and moving the root', () => {
  const root = initialRule();
  for (const [id, target] of [['root', 'segment'], ['segment', 'segment'], ['segment', 'west'], ['missing', 'root'], ['west', 'missing']]) assert.equal(moveNode(root, id, target), root);
  const nested: Group = { id: 'root', kind: 'group', mode: 'all', children: [{ id: 'outer', kind: 'group', mode: 'all', children: [initialRule()] }] };
  assert.equal(moveNode(nested, 'outer', 'segment'), nested);
});
test('moving preserves IDs, immutability, and meaning when reordering siblings', () => {
  const root = initialRule(); const original = JSON.stringify(root);
  const moved = moveNode(root, 'total', 'root', 1);
  assert.equal(JSON.stringify(root), original);
  assert.deepEqual(flatten(moved).map(x => x.node.id).sort(), flatten(root).map(x => x.node.id).sort());
  assert.deepEqual(orders.filter(compileRule(moved)), orders.filter(compileRule(root)));
  const regrouped = moveNode(root, 'west', 'root');
  assert.deepEqual(orders.filter(compileRule(regrouped)), []);
});
test('cannot move a subtree beyond the supported depth', () => {
  const root = initialRule();
  root.children.push({ id: 'deep1', kind: 'group', mode: 'all', children: [{ id: 'deep2', kind: 'group', mode: 'all', children: [{ id: 'deep3', kind: 'group', mode: 'all', children: [] }] }] });
  assert.equal(moveNode(root, 'segment', 'deep3'), root);
});
