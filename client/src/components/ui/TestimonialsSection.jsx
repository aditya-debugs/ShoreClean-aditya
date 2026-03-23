import { motion } from "motion/react";
import { TestimonialsColumn } from "./testimonials-columns-1";

const testimonials = [
  {
    text: "ShoreClean completely transformed how we organise our beach cleanup drives. The real-time volunteer tracking and QR check-ins cut our coordination time in half.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
    name: "Priya Sharma",
    role: "Environmental Activist",
  },
  {
    text: "The gamification features keep our volunteers genuinely excited. We grew from 20 regulars to over 200 participants in just six months!",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    name: "Arjun Patel",
    role: "Volunteer Coordinator",
  },
  {
    text: "The impact analytics let us report scientifically on how much waste we've removed. It's invaluable for our marine conservation research.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face",
    name: "Dr. Meera Krishnan",
    role: "Marine Biologist",
  },
  {
    text: "Organising a cleanup event used to take days of WhatsApp coordination. Now I create an event, share the link, and ShoreClean handles everything else.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
    name: "Rohit Verma",
    role: "Community Organiser",
  },
  {
    text: "I love being able to see my environmental impact grow over time. The certificates and badges make me feel truly recognised for my contributions.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
    name: "Sneha Nair",
    role: "Regular Volunteer",
  },
  {
    text: "The donation management system made it straightforward to contribute to cleanup efforts I believe in. Transparent, seamless, and meaningful.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
    name: "Kabir Malhotra",
    role: "CSR Manager",
  },
  {
    text: "ShoreClean's multilingual chatbot helped us onboard non-English-speaking volunteers from our fishing community. Incredible reach.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face",
    name: "Anjali Desai",
    role: "NGO Director",
  },
  {
    text: "The trash marker map is a game-changer. Volunteers report hotspots in real time and we can plan our next cleanup based on actual data.",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face",
    name: "Vikram Iyer",
    role: "Data Analyst",
  },
  {
    text: "Partnering with ShoreClean for our CSR initiative gave us verifiable impact reports. Our leadership team was genuinely impressed.",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop&crop=face",
    name: "Divya Menon",
    role: "Corporate Relations Lead",
  },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const TestimonialsSection = () => {
  return (
    <section
      id="testimonials"
      className="py-20 px-6 bg-gradient-to-b from-white/80 to-cyan-50/50 relative overflow-hidden"
    >
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[560px] mx-auto mb-12"
        >

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-800 text-center">
            What Our{" "}
            <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
              Community Says
            </span>
          </h2>

          <p className="text-center mt-4 text-gray-500 text-lg max-w-md">
            Hear from the organizers and volunteers who are making a real
            difference with ShoreClean.
          </p>
        </motion.div>

        {/* Scrolling columns */}
        <div className="flex justify-center gap-6 mt-4 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] max-h-[720px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn
            testimonials={secondColumn}
            className="hidden md:block"
            duration={19}
          />
          <TestimonialsColumn
            testimonials={thirdColumn}
            className="hidden lg:block"
            duration={17}
          />
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
