import Footer from "@/components/Footer";
import NavBar from "@/components/NavBar";

export default function StylesPage() {
  return (
    <div className="min-h-screen bg-[#ececec]">
      <main className="mx-auto min-h-screen w-full max-w-[430px] bg-[#ffffff] pb-10 text-[#1f1f1f]">
        <NavBar />
        <section className="px-4 py-12 text-center text-base font-semibold text-[#6f6f6f]">
          빈 페이지
        </section>
        <Footer />
      </main>
    </div>
  );
}
