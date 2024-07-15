import WebCamContainer from "@/components/WebcamContainer";

export default function Home() {
  return (
    <main className="min-h-screen items-center p-24">
      <h3 className="text-2xl mb-6 text-center">Face Detection - face-api.js</h3>
      <WebCamContainer />
    </main>
  );
}
