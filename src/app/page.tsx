export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <h1 className="text-4xl font-bold text-gray-900">Sprint</h1>
      <p className="mt-2 text-lg text-gray-500">
        Classroom MVP test sprints. Coming soon.
      </p>
      <a
        href="/api/smoke"
        className="mt-8 text-sm text-gray-400 underline hover:text-gray-600"
      >
        smoke test
      </a>
    </div>
  );
}
