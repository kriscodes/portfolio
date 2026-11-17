/** Fictional order-review model. No employer rules, schemas, or implementation. */
export type Field = 'amount' | 'region' | 'channel';
export type Condition = {
  id: string;
  kind: 'condition';
  field: Field;
  operator: 'gte' | 'eq' | 'neq';
  value: string;
};
export type Group = { id: string; kind: 'group'; mode: 'all' | 'any'; children: RuleNode[] };
export type RuleNode = Condition | Group;
export type Order = { id: string; amount: number; region: string; channel: string };
export const MAX_DEPTH = 4;
export const MAX_NODES = 24;
export const fields = {
  amount: { label: 'Order total ($)', values: [] as string[] },
  region: { label: 'Region', values: ['West', 'East', 'Central'] },
  channel: { label: 'Channel', values: ['Online', 'Store', 'Partner'] },
};
export const orders: Order[] = [
  { id: 'DEMO-01', amount: 1250, region: 'West', channel: 'Online' },
  { id: 'DEMO-02', amount: 180, region: 'East', channel: 'Store' },
  { id: 'DEMO-03', amount: 920, region: 'Central', channel: 'Partner' },
  { id: 'DEMO-04', amount: 640, region: 'West', channel: 'Store' },
  { id: 'DEMO-05', amount: 2400, region: 'East', channel: 'Online' },
  { id: 'DEMO-06', amount: 75, region: 'West', channel: 'Partner' },
  { id: 'DEMO-07', amount: 510, region: 'Central', channel: 'Store' },
  { id: 'DEMO-08', amount: 780, region: 'East', channel: 'Partner' },
];
export function initialRule(): Group {
  return {
    id: 'root',
    kind: 'group',
    mode: 'all',
    children: [
      { id: 'total', kind: 'condition', field: 'amount', operator: 'gte', value: '500' },
      {
        id: 'segment',
        kind: 'group',
        mode: 'any',
        children: [
          { id: 'west', kind: 'condition', field: 'region', operator: 'eq', value: 'West' },
          { id: 'partner', kind: 'condition', field: 'channel', operator: 'eq', value: 'Partner' },
        ],
      },
    ],
  };
}
export function flatten(
  node: RuleNode,
  depth = 0,
  parent = '',
): { node: RuleNode; depth: number; parent: string }[] {
  return [
    { node, depth, parent },
    ...(node.kind === 'group'
      ? node.children.flatMap((child) => flatten(child, depth + 1, node.id))
      : []),
  ];
}
export function updateNode(root: Group, id: string, update: (node: RuleNode) => RuleNode): Group {
  const walk = (node: RuleNode): RuleNode =>
    node.id === id
      ? update(node)
      : node.kind === 'group'
        ? { ...node, children: node.children.map(walk) }
        : node;
  return walk(root) as Group;
}
export function removeNode(root: Group, id: string): Group {
  return {
    ...root,
    children: root.children
      .filter((node) => node.id !== id)
      .map((node) => (node.kind === 'group' ? removeNode(node, id) : node)),
  };
}
export function moveNode(root: Group, id: string, targetId: string, index?: number): Group {
  if (id === root.id) return root;
  const items = flatten(root);
  const item = items.find((item) => item.node.id === id);
  const target = items.find((item) => item.node.id === targetId);
  if (!item || !target || target.node.kind !== 'group') return root;
  const subtree = flatten(item.node);
  if (subtree.some((entry) => entry.node.id === targetId)) return root;
  if (target.depth + 1 + Math.max(...subtree.map((entry) => entry.depth)) > MAX_DEPTH) return root;
  const removed = removeNode(root, id);
  return updateNode(removed, targetId, (node) => {
    if (node.kind !== 'group') return node;
    const children = [...node.children];
    children.splice(
      index === undefined ? children.length : Math.max(0, Math.min(index, children.length)),
      0,
      item.node,
    );
    return { ...node, children };
  });
}
export function validateRule(root: Group): { id: string; message: string }[] {
  const errors: { id: string; message: string }[] = [];
  const items = flatten(root);
  if (items.length > MAX_NODES)
    errors.push({ id: root.id, message: `This demo supports up to ${MAX_NODES} items.` });
  for (const { node, depth } of items) {
    if (depth > MAX_DEPTH)
      errors.push({ id: node.id, message: `Use at most ${MAX_DEPTH} nesting levels.` });
    if (node.kind === 'group') {
      if (!node.children.length)
        errors.push({ id: node.id, message: 'Add a condition or remove this empty group.' });
    } else if (node.field === 'amount') {
      if (!node.value.trim() || !Number.isFinite(Number(node.value)) || Number(node.value) < 0)
        errors.push({ id: node.id, message: 'Enter a valid amount of zero or more.' });
    } else if (!fields[node.field].values.includes(node.value) || node.operator === 'gte') {
      errors.push({ id: node.id, message: 'Choose a valid value and comparison for this field.' });
    }
  }
  return errors;
}
export function describeRule(node: RuleNode): string {
  if (node.kind === 'group')
    return `(${node.children.map(describeRule).join(node.mode === 'all' ? ' AND ' : ' OR ')})`;
  return `${fields[node.field].label} ${node.operator === 'gte' ? '≥' : node.operator === 'eq' ? '=' : '≠'} ${node.value || '…'}`;
}
/** Compile once per preview; short-circuit groups. This is not a database-scale engine. */
export function compileRule(root: Group): (order: Order) => boolean {
  if (validateRule(root).length) throw new Error('Fix validation errors before previewing.');
  const compile = (node: RuleNode): ((order: Order) => boolean) => {
    if (node.kind === 'group') {
      const children = node.children.map(compile);
      return node.mode === 'all'
        ? (order) => children.every((test) => test(order))
        : (order) => children.some((test) => test(order));
    }
    const expected = node.field === 'amount' ? Number(node.value) : node.value;
    return (order) =>
      node.operator === 'gte'
        ? Number(order[node.field]) >= Number(expected)
        : node.operator === 'neq'
          ? order[node.field] !== expected
          : order[node.field] === expected;
  };
  return compile(root);
}
