# Monitor project previews

`mountProjectPreview(id, host)` lazily loads one project and returns its lifecycle
handle. Mount hosts inside the document with explicit width and height. Previews
start inactive; call `setActive(true)` after the monitor reaches its close-up and
`setActive(false)` while changing views. Call `dispose()` when leaving the studio.
Disposal is idempotent. A repeated mount on the same host disposes the old root.
If a route changes during loading, dispose the returned handle when the promise
resolves. The caller owns its loading, error, retry and cancellation UI.

Both previews use isolated Shadow DOM and retain their own state between monitor
tabs while mounted. They publish no global JavaScript names.

## CareIQ

`public/studio/projects/careiq-preview.js` preserves the approved interactive
synthetic CareIQ application from the original studio prototype. It is a local
ES module, loaded only after its project opens. The bundle includes its own React,
React DOM and Scheduler runtime; their MIT license is retained at the top of the
file. Keeping this application as a separate root avoids coupling its internal
React runtime and extensive styles to the portfolio.

The original exported global mounts have been replaced with one ESM export.
The synthetic availability endpoint also accepts its query string and returns
slots for the date selected in the booking form (the prototype compared the full
query string to a bare path and incorrectly returned an error).
Application behavior is otherwise preserved. The bundled adapter uses in-memory
synthetic data. It has no `fetch`, XMLHttpRequest, WebSocket, beacon, local storage,
or session storage calls. Messages, form submissions, reminders, uploads and
workflow actions affect only that demo workspace. External links are intercepted
and display an explanatory boundary message. Reset clears the in-memory demo.

Unmounting the React root clears its effects, polling interval and timers.
Inactive CareIQ roots keep their in-memory workspace and do no rendering loop;
their synthetic inbox polling effect remains until unmount.

## Neon Drift

The experiment is readable TypeScript in `neon-drift.ts`, with scoped CSS in
`neon-drift.styles.ts`. It preserves the prototype's particle behavior, perspective
correct pointer input, Drift/Orbit modes, three palettes, pause/play, and clear.
Reduced motion starts with static artwork while drag input still draws. A visitor
can explicitly choose Play. Hidden documents and inactive monitors pause their
animation frame. Disposal removes pointer capture, frame, listeners and observer.
