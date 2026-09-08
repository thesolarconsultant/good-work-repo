import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { findConflicts, serviceSegments, totalDuration } from "../engine/availability.js";
import { clock } from "./demo.js";

const PX_PER_MIN = 1.2;
const SNAP = 5;

/** Human wording for a refusal. The receptionist gets the reason, not a code. */
function explain(conflicts, staffById) {
  return conflicts.map((c) => {
    if (c.kind === "staff") return `${staffById[c.staffId]?.name ?? "That stylist"} is already booked then`;
    if (c.kind === "room") return `No room free — that space holds ${c.capacity}`;
    if (c.kind === "client") return "That client is already booked at that time";
    if (c.kind === "off_shift") return `${staffById[c.staffId]?.name ?? "They"} isn't rostered then`;
    return "That slot isn't available";
  });
}

/**
 * Side-by-side lanes for bookings that overlap in the same column.
 *
 * Overlap is legitimate here — a client sits developing while the stylist
 * starts someone else — so stacking them is not an error to prevent, it is a
 * layout to solve. Greedy over an interval graph: each cluster of touching
 * bookings gets the narrowest set of lanes that keeps them apart.
 */
function laneOut(items) {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
  const placed = new Map();
  let cluster = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    const laneEnds = [];
    for (const item of cluster) {
      let lane = laneEnds.findIndex((end) => end <= item.start);
      if (lane === -1) { laneEnds.push(item.end); lane = laneEnds.length - 1; }
      else laneEnds[lane] = item.end;
      placed.set(item.id, { lane, lanes: 0 });
    }
    for (const item of cluster) placed.get(item.id).lanes = laneEnds.length;
    cluster = [];
    clusterEnd = -Infinity;
  };

  for (const item of sorted) {
    if (cluster.length && item.start >= clusterEnd) flush();
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  if (cluster.length) flush();
  return placed;
}

function Appointment({ booking, service, client, top, height, onGrab, dragging, invalid, lane }) {
  // The developing window is drawn inside the block, so a stylist can see the
  // gap they're free in rather than having to know the service by heart.
  const gap = serviceSegments(service).find((s) => !s.staff && s.room && s.from < service.duration);

  return (
    <button
      type="button"
      className={`gwc-appt${height < 34 ? " gwc-appt--short" : ""}`}
      data-colour={service.colour}
      data-dragging={dragging || undefined}
      data-invalid={invalid || undefined}
      style={{
        top,
        height,
        "--appt-left": lane ? `calc(${(lane.lane / lane.lanes) * 100}% + 3px)` : undefined,
        "--appt-width": lane ? `calc(${100 / lane.lanes}% - 6px)` : undefined,
      }}
      onPointerDown={onGrab}
      title={`${client?.name ?? "Client"} — ${service.name}, ${clock(booking.start)}`}
    >
      {gap && (
        <span
          className="gwc-appt__processing"
          style={{ top: gap.from * PX_PER_MIN, height: (gap.to - gap.from) * PX_PER_MIN }}
          aria-hidden="true"
        />
      )}
      {client?.note && <span className="gwc-appt__flag" aria-hidden="true">⚑</span>}
      <span className="gwc-appt__client">{client?.name ?? "Client"}</span>
      <span className="gwc-appt__service">{service.name}</span>
      <span className="gwc-appt__time">
        {clock(booking.start)}–{clock(booking.start + service.duration)}
      </span>
    </button>
  );
}

export default function Calendar({
  staff, bookings, shifts, services, clients, roomCapacity,
  dayStart, dayEnd, onMove, onPickSlot, now,
}) {
  const gridRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const [toast, setToast] = useState(null);

  const staffById = useMemo(() => Object.fromEntries(staff.map((s) => [s.id, s])), [staff]);
  const clientById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients]);
  const height = (dayEnd - dayStart) * PX_PER_MIN;

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  /** Where a dragged booking currently sits — staff column and start time. */
  const resolveDrag = useCallback((event, state) => {
    const grid = gridRef.current;
    if (!grid) return state;
    const rect = grid.getBoundingClientRect();
    const gutter = Number.parseFloat(getComputedStyle(grid).gridTemplateColumns.split(" ")[0]) || 68;
    const colWidth = (rect.width - gutter) / staff.length;

    const index = Math.min(
      staff.length - 1,
      Math.max(0, Math.floor((event.clientX - rect.left - gutter) / colWidth)),
    );
    const minutes = (event.clientY - rect.top - state.grabOffset) / PX_PER_MIN + dayStart;
    const start = Math.round(minutes / SNAP) * SNAP;

    return { ...state, staffId: staff[index].id, start };
  }, [staff, dayStart]);

  useEffect(() => {
    if (!drag) return undefined;

    const move = (event) => {
      setDrag((current) => {
        if (!current) return current;
        const next = resolveDrag(event, current);
        const candidate = { ...current.booking, start: next.start, staffId: next.staffId };
        const conflicts = findConflicts(candidate, bookings, { shifts, roomCapacity });
        return { ...next, conflicts };
      });
    };

    const up = () => {
      setDrag((current) => {
        if (!current) return null;
        // Nothing moved — treat it as a click, not a failed drag.
        const moved = current.start !== current.booking.start || current.staffId !== current.booking.staffId;
        if (!moved) return null;

        if (current.conflicts?.length) {
          setToast({ tone: "error", lines: explain(current.conflicts, staffById) });
          return null;
        }
        onMove(current.booking.id, { start: current.start, staffId: current.staffId });
        setToast({
          tone: "ok",
          lines: [`Moved to ${clock(current.start)} with ${staffById[current.staffId].name}`],
        });
        return null;
      });
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [drag, bookings, shifts, roomCapacity, resolveDrag, onMove, staffById]);

  const grab = (booking) => (event) => {
    if (event.button !== 0) return;
    const box = event.currentTarget.getBoundingClientRect();
    setDrag({
      booking,
      grabOffset: event.clientY - box.top,
      start: booking.start,
      staffId: booking.staffId,
      conflicts: [],
    });
  };

  const hours = [];
  for (let m = Math.ceil(dayStart / 60) * 60; m <= dayEnd; m += 60) hours.push(m);

  return (
    <div className="gwc-cal" style={{ "--cols": staff.length }}>
      <div className="gwc-cal__head">
        <div className="gwc-cal__headcell" />
        {staff.map((member) => {
          const shift = shifts.find((s) => s.staffId === member.id);
          return (
            <div className="gwc-cal__headcell" key={member.id}>
              <div className="gwc-cal__staff">
                <span className="gwc-avatar">{member.initials}</span>
                <span style={{ minWidth: 0 }}>
                  <span className="gwc-cal__staffname">{member.name}</span>
                  <span className="gwc-cal__staffrole">
                    {shift ? `${clock(shift.start)}–${clock(shift.end)}` : "Not in"}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="gwc-cal__body">
        <div className="gwc-cal__grid" ref={gridRef} style={{ height }}>
          <div className="gwc-cal__gutter">
            {hours.map((m) => (
              <span className="gwc-cal__hour" key={m} style={{ top: (m - dayStart) * PX_PER_MIN }}>
                {clock(m)}
              </span>
            ))}
          </div>

          {staff.map((member) => {
            const shift = shifts.find((s) => s.staffId === member.id);
            const mine = bookings.filter((b) => b.staffId === member.id && b.status !== "cancelled");
            const lanes = laneOut(mine.map((b) => ({
              id: b.id,
              start: b.start,
              end: b.start + totalDuration(services[b.serviceId]),
            })));
            return (
              <div
                className="gwc-cal__col"
                key={member.id}
                onClick={(event) => {
                  if (event.target !== event.currentTarget) return;
                  const y = event.clientY - event.currentTarget.getBoundingClientRect().top;
                  const start = Math.round((y / PX_PER_MIN + dayStart) / 15) * 15;
                  onPickSlot({ staffId: member.id, start });
                }}
              >
                {/* Before and after the roster — visible, but plainly not bookable. */}
                {shift && shift.start > dayStart && (
                  <span className="gwc-cal__off" style={{ top: 0, height: (shift.start - dayStart) * PX_PER_MIN }} />
                )}
                {shift && shift.end < dayEnd && (
                  <span className="gwc-cal__off" style={{ top: (shift.end - dayStart) * PX_PER_MIN, bottom: 0 }} />
                )}
                {!shift && <span className="gwc-cal__off" style={{ top: 0, bottom: 0 }} />}

                {hours.map((m) => (
                  <span key={m} className="gwc-cal__rule gwc-cal__rule--hour" style={{ top: (m - dayStart) * PX_PER_MIN }} />
                ))}

                {mine.map((booking) => {
                  const service = services[booking.serviceId];
                  const isDragged = drag?.booking.id === booking.id;
                  const start = isDragged && drag.staffId === member.id ? drag.start : booking.start;
                  // While dragging to another column, keep the block under the cursor.
                  if (isDragged && drag.staffId !== member.id) return null;
                  return (
                    <Appointment
                      key={booking.id}
                      booking={{ ...booking, start }}
                      service={service}
                      client={clientById[booking.clientId]}
                      top={(start - dayStart) * PX_PER_MIN}
                      height={totalDuration(service) * PX_PER_MIN}
                      onGrab={grab(booking)}
                      dragging={isDragged}
                      invalid={isDragged && drag.conflicts.length > 0}
                      lane={lanes.get(booking.id)}
                    />
                  );
                })}

                {/* A dragged block that has crossed into this column. */}
                {drag && drag.staffId === member.id && drag.booking.staffId !== member.id && (
                  <Appointment
                    booking={{ ...drag.booking, start: drag.start }}
                    service={services[drag.booking.serviceId]}
                    client={clientById[drag.booking.clientId]}
                    top={(drag.start - dayStart) * PX_PER_MIN}
                    height={totalDuration(services[drag.booking.serviceId]) * PX_PER_MIN}
                    onGrab={() => {}}
                    dragging
                    invalid={drag.conflicts.length > 0}
                  />
                )}
              </div>
            );
          })}

          {now >= dayStart && now <= dayEnd && (
            <div className="gwc-cal__now" style={{ top: (now - dayStart) * PX_PER_MIN, gridColumn: "2 / -1" }} />
          )}
        </div>
      </div>

      {toast && (
        <div className="gwc-toast" data-tone={toast.tone} role="status">
          <span>{toast.tone === "error" ? "✕" : "✓"}</span>
          <span>{toast.lines.join(" · ")}</span>
        </div>
      )}
    </div>
  );
}
