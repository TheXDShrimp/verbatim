import { auth0 } from "@/lib/auth";
import Link from "next/link";
import {Inter} from "next/font/google";

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

    return (<>
      {/* navbar */}
      <div className="absolute top-0 left-0 w-screen">
      <nav className="flex items-center justify-between p-8">
        <div className="flex items-center space-x-4">
          <h1 className="text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600 text-2xl font-bold">Verbatim</h1>
        </div>
        <div className="flex items-center space-x-8">
          {user ? (<>
            <Link href="/dashboard" className="text-lg font-semibold hover:text-gray-300">Dashboard</Link>
            <Link href="/upload" className="text-lg font-semibold hover:text-gray-300">Upload</Link>
            <Link href="/auth/logout" className="text-lg font-semibold hover:text-gray-300">Logout</Link></>
          ) : (<>
            <Link href="/auth/login" className="text-lg font-semibold hover:text-gray-300">Login</Link>
            <Link href="/auth/login?screen_hint=signup" className="text-lg font-semibold hover:text-red-500">Sign up</Link></>
          )}
        </div>
      </nav>
      </div>
        {/* main content */}
        <main
          className={`flex h-screen flex-col items-center justify-between p-24 ${inter.className}`}
        >
          {/* container in the middle vertically + horizontally */}
          <div className="flex flex-col items-center justify-center space-y-8 h-screen w-screen">
            <div className="w-3/4 relative flex place-items-center">
              {/* two columns, one 2/3 and one 1/3 */}
              <div className="w-full items-center justify-center">
                  <h1 className="text-8xl font-bold text-center">
                    Welcome to <br />
                    <span className="text-transparent text-9xl bg-clip-text bg-gradient-to-br from-yellow-400 to-orange-600">
                      Verbatim
                    </span>
                  </h1>
                  <p className="text-2xl text-center mt-6">
                    Dub, Sub, and Summarize any video in seconds.
                  </p>
              </div>
            </div>
          </div>
        </main>
        </>
  );
}