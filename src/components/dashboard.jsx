import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jwt_decode from "jwt-decode";
import DashboardNav from "./DashboardNav";
import DashboardBody from "./DashboardBody";
import StoreBody from "./StoreBody";
import Snowflakes from "magic-snowflakes";

const Dashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const navigate = useNavigate();

  //////////////////// christmas szn changes////////////////////
  const snowflakes = new Snowflakes({
    color: "#11A7E0",
    count: 10,
  });

  const snowflakes2 = new Snowflakes({
    color: "#EE4B2B",
    count: 10,
  });

  const snowflakes3 = new Snowflakes({
    color: "#007638",
    count: 10,
  });

  useEffect(() => {
    snowflakes.start();
    snowflakes2.start();
    snowflakes3.start();
  }, []);

  //////////////////// christmas szn changes////////////////////

  return (
    <div>
      <DashboardNav setSelectedCategory={setSelectedCategory} />

      <DashboardBody selectedCategory={selectedCategory} />
      <footer className="footer p-10 bg-base-300 flex mt-[20vh]">
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
    </div>
  );
};

export default Dashboard;
