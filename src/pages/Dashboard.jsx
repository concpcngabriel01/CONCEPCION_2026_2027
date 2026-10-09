import landingPicture from "../assets/landing.jpeg";

export default function AboutMe() {
  return (
    <section
      id="about-me"
      className="relative isolate mx-auto max-w-6xl overflow-hidden px-5 py-12 sm:px-8 sm:py-16 lg:px-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl"
      />

      <div className="grid items-center gap-10 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/20 backdrop-blur sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14 lg:p-14">
        <div className="order-2 lg:order-1">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-indigo-300">
            About me
          </p>
          <h1 className="mb-4 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Hi, I&apos;m
            <span className="block bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              Gabriel C. Concepcion
            </span>
          </h1>
          <p className="mb-6 text-lg font-medium text-slate-300 sm:text-xl">
            Student aspiring to be a web developer
          </p>
          <p className="max-w-2xl text-base leading-7 text-slate-400">
            I enjoy learning new things and creating activities in school.
            Right now, I am learning web development and other branches of IT,
            and I am excited about the future.
          </p>

          <blockquote className="mt-8 border-l-2 border-indigo-400 pl-4 text-lg italic text-slate-200">
            “Di baleng tamad, wag lang pagod.”
          </blockquote>

          <div className="mt-9">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Get in touch
            </h2>
            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
              <li>
                <a
                  className="group flex h-full flex-col rounded-xl border border-white/10 bg-slate-950/60 p-4 no-underline transition duration-200 ease-out hover:-translate-y-1 hover:border-indigo-400/50 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
                  href="mailto:concepciongabriel0101@gmail.com"
                >
                  <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    Email
                  </span>
                  <span className="break-all text-sm text-slate-200 group-hover:text-white">
                    concepciongabriel0101@gmail.com
                  </span>
                </a>
              </li>
              <li>
                <a
                  className="group flex h-full flex-col rounded-xl border border-white/10 bg-slate-950/60 p-4 no-underline transition duration-200 ease-out hover:-translate-y-1 hover:border-indigo-400/50 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
                  href="https://github.com/concpcngabriel01"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    GitHub
                  </span>
                  <span className="text-sm text-slate-200 group-hover:text-white">
                    @concpcngabriel01
                  </span>
                </a>
              </li>
              <li>
                <a
                  className="group flex h-full flex-col rounded-xl border border-white/10 bg-slate-950/60 p-4 no-underline transition duration-200 ease-out hover:-translate-y-1 hover:border-indigo-400/50 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
                  href="https://facebook.com/gabriel.c.concepcion"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                    Facebook
                  </span>
                  <span className="text-sm text-slate-200 group-hover:text-white">
                    Gabriel C. Concepcion
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="relative order-1 mx-auto w-full max-w-sm lg:order-2">
          <div
            aria-hidden="true"
            className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-indigo-500/50 to-cyan-400/30 opacity-70 blur-xl"
          />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-slate-800 p-2 shadow-xl">
            <img
              className="aspect-[4/5] w-full rounded-[1.5rem] object-cover"
              src={landingPicture}
              alt="Gabriel C. Concepcion"
            />
            <div className="absolute inset-x-2 bottom-2 rounded-b-[1.5rem] bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent px-6 pb-6 pt-16">
              <p className="m-0 text-sm font-medium text-slate-300">
                Learning, creating, and growing
              </p>
              <p className="mb-0 mt-1 text-xl font-bold text-white">
                One project at a time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
