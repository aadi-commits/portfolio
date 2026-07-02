import { Nav } from "@/components/Nav";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Experience } from "@/components/sections/Experience";
import { Projects } from "@/components/sections/Projects";
import { Demo } from "@/components/sections/Demo";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { StatusBar } from "@/components/StatusBar";

export default function Home() {
  return (
    <>
      <JsonLd />
      <Nav />
      <main className="flex w-full flex-1 flex-col pb-7">
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Demo />
        <Contact />
      </main>
      <Footer />
      <StatusBar />
      <ChatWidget />
    </>
  );
}
