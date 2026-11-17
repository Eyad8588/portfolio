import Link from "next/link";
export default function NotFound() {
  return (
    <section className="wrap section" style={{ textAlign: "center" }}>
      <h1>Page not found</h1>
      <p className="muted">
        <Link href="/">Back home</Link>
      </p>
    </section>
  );
}
