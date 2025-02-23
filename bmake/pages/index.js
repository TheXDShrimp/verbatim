import { auth0 } from "@/lib/auth";
import Link from "next/link";
import { Inter } from "next/font/google";
import Head from "next/head";

export async function getServerSideProps(context) {
  const session = await auth0.getSession(context.req, context.res);

  return {
    props: {
      user: session?.user || null,
    },
  };
}

const inter = Inter({ subsets: ["latin"] });

export default function Home({ user }) {
  return (
    <>
      <Head>
        <title>Verbatim</title>
        <meta name="description" content="Dub, Sub, and Summarize any video in seconds." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* Navbar */}
      <div className="absolute top-0 left-0 w-screen">
        <nav className="flex items-center justify-between p-8">
          <div className="flex items-center space-x-4">
            <img src="/favicon.ico" alt="Logo" className="w-8 h-8 md:w-10 md:h-10" />
            <h1 className="text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600 text-[clamp(24px,5vw,32px)] font-bold">
              Verbatim
            </h1>
          </div>
          <div className="flex items-center space-x-8">
            {user ? (
              <>
                <Link href="/dashboard" className="text-lg font-semibold hover:text-gray-300">
                  Dashboard
                </Link>
                <Link href="/upload" className="text-lg font-semibold hover:text-gray-300">
                  Upload
                </Link>
                <Link href="/auth/logout" className="text-lg font-semibold hover:text-gray-300">
                  Logout
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-lg font-semibold hover:text-gray-300">
                  Login
                </Link>
                <Link href="/auth/login?screen_hint=signup" className="text-lg font-semibold hover:text-red-500">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className={`flex h-screen flex-col items-center justify-between p-6 md:p-16 ${inter.className}`}>
        <div className="flex flex-col items-center justify-center space-y-8 h-screen w-screen">
          <div className="w-4/5 md:w-3/4 relative flex place-items-center text-center">
            {/* Responsive Title */}
            <div className="w-full">
              <h1 className="font-bold text-[clamp(36px,10vw,96px)] leading-tight">
                Welcome to <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600 text-[clamp(40px,12vw,108px)]">
                  Verbatim
                </span>
              </h1>
              <p className="text-[clamp(16px,2.5vw,24px)] mt-6">
                Dub, Sub, and Summarize any video in seconds.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}