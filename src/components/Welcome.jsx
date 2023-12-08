import { useNavigate } from "react-router-dom";
import TCCLogo from "../assets/TCC-space.png";
import BgBlur from "../assets/bgusc.png";
const Welcome = () => {
  const navigate = useNavigate();
  const toRegister = () => {
    navigate("/api/register");
  };
  const toLogin = () => {
    navigate("/api/login");
  };

  return (
    <>
      <div
        className={`flex items-center justify-center h-screen p-10 bg-no-repeat bg-cover`}
        style={{ backgroundImage: `url(${BgBlur})` }}
      >
        <div className="flex flex-col space-y-10 lg:flex-col lg:space-y-10 lg:w-[50vw]">
          <div className="card card-compact w-full bg-base-300 shadow-xl p-5 items-center justify-center ">
            <span className="uscbrand text-bold mb-5 text-2xl lg:text-[50px]">
              <img src={TCCLogo} alt="LOGO" />
            </span>
            <h2 className="text-justify p-3">
              Designed by and for Carolinians, our app goes beyond utility, it's
              a dynamic space crafted to meet your needs. Join us in this
              digital realm created from the heart of the USC community, for the
              heart of the USC community.
            </h2>
          </div>
          <div className="card w-full bg-base-300 shadow-xl p-5 space-y-5 justify-center">
            <button
              type="button"
              className="btn bg-[#13ac4c] text-white"
              onClick={toLogin}
            >
              Login
            </button>

            <button
              type="button"
              className="btn bg-warning text-white"
              onClick={toRegister}
            >
              Register
            </button>
          </div>
        </div>
      </div>
      <footer className="footer p-10 bg-base-300 flex">
        <nav>
          <header className="footer-title text-white">
            The Carolinian Connection
          </header>
          <p className="text-justify">
            Embark on a digital revolution designed exclusively for the dynamic
            community of University of San Carlos students! Say hello to "The
            Carolinian Connection", where tech meets the unmistakable Carolinian
            spirit. It's not just an app; it's your passport to a world of
            seamless communication, interactive forums, and a marketplace
            curated for the USC experience. Let's redefine the way Carolinians
            connect, engage, and thrive together!
          </p>
        </nav>
      </footer>
      <footer className="footer footer-center p-4 bg-base-300 text-base-content">
        <aside className="flex flex-col">
          <div className="text-md">
            Made with <span className="text-red-500">&#10084;</span>
          </div>
          <div className="flex flex-col  font-bold lg:flex-row lg:space-x-10">
            <ul>
              <a href="https://github.com/noturnachs" target="_blank">
                Dan Lius Monsales
              </a>
            </ul>
            <ul>
              <a href="https://github.com/prognewb" target="_blank">
                Niño Jan Roz Cabatas
              </a>
            </ul>
            <ul>
              <a href="https://github.com/clandy07" target="_blank">
                Eduardo Miguel Cortes
              </a>
            </ul>
            <ul>
              <a href="https://github.com/graysonLL" target="_blank">
                Liam Michael Jones
              </a>
            </ul>
          </div>
        </aside>
      </footer>
    </>
  );
};

export default Welcome;
