'use client';

import { useRef, useState } from 'react';
import {
  compileRule,
  describeRule,
  fields,
  flatten,
  initialRule,
  MAX_DEPTH,
  MAX_NODES,
  moveNode,
  orders,
  removeNode,
  updateNode,
  validateRule,
  type Condition,
  type Field,
  type Group,
  type RuleNode,
} from './rule-model';
import './rule-builder.css';

export default function RuleBuilder() {
  const [rule, setRule] = useState<Group>(initialRule);
  const [message, setMessage] = useState(
    'Try the example, then change a condition or move a group.',
  );
  const [preview, setPreview] = useState<{ source: string; matches: string[] } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const counter = useRef(0);
  const items = flatten(rule);
  const errors = validateRule(rule);
  const source = JSON.stringify(rule);
  const stale = preview !== null && preview.source !== source;
  const groups = items.filter((item) => item.node.kind === 'group');
  function edit(id: string, change: (node: RuleNode) => RuleNode) {
    setRule((current) => updateNode(current, id, change));
  }
  function move(id: string, target: string, index?: number) {
    const next = moveNode(rule, id, target, index);
    if (next === rule) {
      setMessage('That move would create a cycle or exceed the nesting limit.');
      return;
    }
    setRule(next);
    setMessage('Item moved. Review the logic, then run a fresh preview.');
    setDragging(null);
  }
  function add(group: Group, kind: 'group' | 'condition', depth: number) {
    if (items.length >= MAX_NODES || depth >= MAX_DEPTH) return;
    const id = `new-${++counter.current}`;
    const node: RuleNode =
      kind === 'group'
        ? { id, kind, mode: 'all', children: [] }
        : { id, kind, field: 'amount', operator: 'gte', value: '' };
    edit(group.id, (current) =>
      current.kind === 'group' ? { ...current, children: [...current.children, node] } : current,
    );
    setMessage(
      kind === 'group'
        ? 'Group added. Add at least one condition.'
        : 'Condition added. Enter a value.',
    );
  }
  function controls(node: RuleNode, parent: string, index: number, siblings: number) {
    const forbidden = new Set(flatten(node).map((item) => item.node.id));
    const height = Math.max(...flatten(node).map((item) => item.depth));
    return (
      <div className="rb-move-controls">
        <button
          type="button"
          aria-label={`Move ${node.id} up`}
          disabled={index === 0}
          onClick={() => move(node.id, parent, index - 1)}
        >
          ↑
        </button>
        <button
          type="button"
          aria-label={`Move ${node.id} down`}
          disabled={index === siblings - 1}
          onClick={() => move(node.id, parent, index + 1)}
        >
          ↓
        </button>
        <label className="rb-move-label">
          <span className="rb-sr-only">Move {node.id} to group</span>
          <select value="" onChange={(event) => move(node.id, event.target.value)}>
            <option value="" disabled>
              Move to…
            </option>
            {groups
              .filter(
                (item) => !forbidden.has(item.node.id) && item.depth + 1 + height <= MAX_DEPTH,
              )
              .map((item) => (
                <option key={item.node.id} value={item.node.id}>
                  {item.node.id === 'root' ? 'Root group' : `Group ${item.node.id}`}
                </option>
              ))}
          </select>
        </label>
        <button
          type="button"
          aria-label={`Remove ${node.id}`}
          onClick={() => {
            setRule((current) => removeNode(current, node.id));
            setMessage('Item removed.');
          }}
        >
          Remove
        </button>
      </div>
    );
  }
  function renderNode(
    node: RuleNode,
    depth = 0,
    parent = '',
    index = 0,
    siblings = 1,
  ): React.ReactNode {
    const error = errors.find((error) => error.id === node.id);
    const dragHandle = node.id !== 'root' && (
      <span
        className="rb-drag"
        draggable
        onDragStart={(event) => {
          setDragging(node.id);
          event.dataTransfer.setData('text/plain', node.id);
          event.dataTransfer.effectAllowed = 'move';
        }}
        onDragEnd={() => setDragging(null)}
        title="Drag into another group. Move controls also support keyboard and touch."
        aria-hidden="true"
      >
        ⠿
      </span>
    );
    if (node.kind === 'group')
      return (
        <fieldset
          key={node.id}
          className={`rb-group${depth === 0 ? ' rb-root' : ''}${dragging && dragging !== node.id ? ' rb-drop-ready' : ''}`}
          onDragOver={(event) => {
            if (dragging) {
              event.preventDefault();
              event.stopPropagation();
              event.dataTransfer.dropEffect = 'move';
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (dragging && event.dataTransfer.getData('text/plain') === dragging)
              move(dragging, node.id);
          }}
        >
          <legend>{node.id === 'root' ? 'Review criteria' : `Group ${node.id}`}</legend>
          <div className="rb-group-heading">
            {dragHandle}
            <label>
              Match{' '}
              <select
                aria-label={`Match mode for ${node.id}`}
                value={node.mode}
                onChange={(event) =>
                  edit(node.id, (current) => ({
                    ...current,
                    mode: event.target.value as Group['mode'],
                  }))
                }
              >
                <option value="all">ALL (AND)</option>
                <option value="any">ANY (OR)</option>
              </select>{' '}
              of these
            </label>
            {parent && controls(node, parent, index, siblings)}
          </div>
          <div className="rb-children">
            {node.children.map((child, i) =>
              renderNode(child, depth + 1, node.id, i, node.children.length),
            )}
          </div>
          {error && (
            <p className="rb-error" id={`error-${node.id}`}>
              {error.message}
            </p>
          )}
          <div className="rb-add">
            <button
              type="button"
              disabled={items.length >= MAX_NODES || depth >= MAX_DEPTH}
              onClick={() => add(node, 'condition', depth)}
            >
              + Condition
            </button>
            <button
              type="button"
              disabled={items.length >= MAX_NODES || depth >= MAX_DEPTH - 1}
              onClick={() => add(node, 'group', depth)}
            >
              + Group
            </button>
            <span>{depth ? 'Drop an item into this group' : 'Drag handles or move controls'}</span>
          </div>
        </fieldset>
      );
    const patch = (values: Partial<Condition>) =>
      edit(node.id, (current) =>
        current.kind === 'condition' ? { ...current, ...values } : current,
      );
    return (
      <div key={node.id} className="rb-condition">
        <div className="rb-condition-fields">
          {dragHandle}
          <label>
            <span>Field</span>
            <select
              aria-label={`Field for ${node.id}`}
              value={node.field}
              onChange={(event) => {
                const field = event.target.value as Field;
                patch({
                  field,
                  operator: field === 'amount' ? 'gte' : 'eq',
                  value: field === 'amount' ? '' : fields[field].values[0],
                });
              }}
            >
              {Object.entries(fields).map(([key, field]) => (
                <option key={key} value={key}>
                  {field.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Comparison</span>
            <select
              aria-label={`Comparison for ${node.id}`}
              value={node.operator}
              onChange={(event) => patch({ operator: event.target.value as Condition['operator'] })}
            >
              {node.field === 'amount' && <option value="gte">At least ≥</option>}
              <option value="eq">Equals =</option>
              <option value="neq">Not equal ≠</option>
            </select>
          </label>
          <label>
            <span>Value</span>
            {node.field === 'amount' ? (
              <input
                aria-label={`Value for ${node.id}`}
                value={node.value}
                type="number"
                min="0"
                step="any"
                aria-invalid={!!error}
                aria-describedby={error ? `error-${node.id}` : undefined}
                onChange={(event) => patch({ value: event.target.value })}
              />
            ) : (
              <select
                aria-label={`Value for ${node.id}`}
                value={node.value}
                onChange={(event) => patch({ value: event.target.value })}
              >
                {fields[node.field].values.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            )}
          </label>
        </div>
        {controls(node, parent, index, siblings)}
        {error && (
          <p id={`error-${node.id}`} className="rb-error">
            {error.message}
          </p>
        )}
      </div>
    );
  }
  return (
    <section className="rb" aria-labelledby="builder-title">
      <div className="rb-topbar">
        <div>
          <p className="ip-small-label">Interactive synthetic example</p>
          <h2 id="builder-title">Order review builder</h2>
        </div>
        <span className="rb-badge">Fictional data · Browser only</span>
      </div>
      <p className="rb-intro">
        Review orders of at least $500 from the West region or a partner channel. Edit the rule,
        nest groups, and preview the result. This is an independent demonstration of general UI
        patterns.
      </p>
      <div className="rb-layout">
        <div className="rb-editor">
          {renderNode(rule)}
          <p className="rb-limit">
            Demo limits: {MAX_DEPTH} nesting levels and {MAX_NODES} items. Drag a handle into a
            group, or use ↑, ↓, and Move to… with keyboard or touch.
          </p>
        </div>
        <aside className="rb-summary" aria-label="Rule validation and preview">
          <p className="ip-small-label">01 / Validate</p>
          <h3>
            {errors.length
              ? `${errors.length} issue${errors.length === 1 ? '' : 's'} to fix`
              : 'Ready to preview'}
          </h3>
          <p>
            {errors.length
              ? 'Resolve the inline errors before running a preview.'
              : 'Fields and values are valid. Every group has at least one condition.'}
          </p>
          <p className="ip-small-label">02 / Read the logic</p>
          <p className="rb-expression">{describeRule(rule)}</p>
          <button
            type="button"
            className="rb-primary"
            disabled={errors.length > 0}
            onClick={() => {
              const test = compileRule(rule);
              const matches = orders.filter(test).map((order) => order.id);
              setPreview({ source, matches });
              setMessage(
                `Preview complete: ${matches.length} of ${orders.length} fictional orders match.`,
              );
            }}
          >
            Preview 8 sample orders
          </button>
          <button
            type="button"
            onClick={() => {
              setRule(initialRule());
              setPreview(null);
              setMessage('Example restored.');
            }}
          >
            Reset example
          </button>
          <p className="rb-notice" role="status" aria-live="polite">
            {stale ? 'Rule changed. The previous preview is out of date; run it again.' : message}
          </p>
        </aside>
      </div>
      <div className="rb-results">
        <div className="rb-results-title">
          <h3>Preview against fictional orders</h3>
          <span>
            {preview
              ? `${preview.matches.length} / ${orders.length} matched${stale ? ' · Previous rule' : ''}`
              : 'Run a preview to see matches'}
          </span>
        </div>
        <div
          className="rb-table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Fictional order preview table"
        >
          <table>
            <caption>
              Eight fictional order records. Matching results appear only after a valid preview.
            </caption>
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Total</th>
                <th scope="col">Region</th>
                <th scope="col">Channel</th>
                <th scope="col">Result</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <th scope="row">{order.id}</th>
                  <td>${order.amount.toLocaleString('en-US')}</td>
                  <td>{order.region}</td>
                  <td>{order.channel}</td>
                  <td>
                    <span
                      className={preview?.matches.includes(order.id) && !stale ? 'rb-match' : ''}
                    >
                      {!preview
                        ? 'Not evaluated'
                        : stale
                          ? 'Out of date'
                          : preview.matches.includes(order.id)
                            ? 'Matches'
                            : 'No match'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="rb-limit">
          This eight-row preview illustrates semantics, not production throughput. No records or
          rule definitions are sent to a server.
        </p>
      </div>
    </section>
  );
}
