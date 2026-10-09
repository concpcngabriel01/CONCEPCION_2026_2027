import { useParams } from "react-router";
import billiardsPicture from "../assets/billiards.jpeg";
import gymPicture from "../assets/gym.jpeg";
import guitarPicture from "../assets/guitar.jpeg";

const hobbies = {
  1: {
    name: "Billiards",
    picture: billiardsPicture,
    description:
      "Billiards is a game where players use a cue stick to hit balls into the pockets on a table.",
    reason:
      "My favorite hobby is playing billiards because I enjoy playing it, especially when I am with my friends. For me, it is not just a game because it also needs focus and patience. It helps me relax and forget my stress for a while. That is why, whenever I have free time, playing billiards is one of the things I like to do.",
  },
  2: {
    name: "Gym",
    picture: gymPicture,
    description:
      "Going to the gym is an activity where I exercise and work on my strength and fitness.",
    reason:
      "My hobby is going to the gym because I enjoy working out and learning new exercises. It helps me feel good and gives me time for myself. I also like going to the gym because I can learn to be more disciplined and patient. Whenever I have free time, I enjoy working out and improving my skills.",
  },
  3: {
    name: "Playing Guitar",
    picture: guitarPicture,
    description:
      "Playing guitar is a musical hobby where I can learn songs and practice different chords.",
    reason:
      "My hobby is playing the guitar because I enjoy music and learning how to play different songs. It helps me relax, especially when I feel tired or stressed. I also enjoy practicing new chords and improving my skills. For me, playing guitar is a fun way to spend my free time.",
  },
};

export default function Hobby() {
  const { pk } = useParams();
  const hobby = hobbies[pk];

  if (!hobby) {
    return <p>Sorry, this hobby was not found.</p>;
  }

  return (
    <section className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
      <article className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl sm:p-8">
        <div className="flex flex-col gap-7 md:flex-row md:items-start">
          <img
            className="h-52 w-full rounded-xl object-cover md:w-64 md:shrink-0"
            src={hobby.picture}
            alt={hobby.name}
          />

          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-400">
              My hobby
            </p>
            <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              {hobby.name}
            </h1>
            <h2 className="mb-2 text-lg font-semibold text-slate-200">
              About this hobby
            </h2>
            <p className="m-0 text-base leading-7 text-slate-300">
              {hobby.description}
            </p>
          </div>
        </div>

        <div className="mt-7 border-t border-slate-700 pt-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-200">
            Why I like it
          </h2>
          <p className="m-0 text-base leading-7 text-slate-300">
            {hobby.reason}
          </p>
        </div>
      </article>
    </section>
  );
}
