"use client";

type Props = {
  active: boolean;
  eventName?: string;
  sessionId?: string;
};

export default function SessionHeader({ active, eventName, sessionId }: Props) {
  return (
    <div className="mb-4">
      {active ? (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{eventName}</h2>
            <p className="text-sm text-gray-400">Session ID: {sessionId}</p>
          </div>
          <span className="px-3 py-1 rounded bg-green-600 text-white text-sm">
            ACTIVE
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p>No session started.</p>
          <span className="px-3 py-1 rounded bg-gray-600 text-white text-sm">
            NO ACTIVE SESSION
          </span>
        </div>
      )}
    </div>
  );
}
