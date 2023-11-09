import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();
  const toLogin = () => {
    navigate("/api/login");
  };

  return (
    <>
      <div className="flex items-center justify-center h-screen p-20">
        <div>
          <div className="uscbrand text-bold">
            Welcome to The Carolinian Connection
          </div>
          <span>
            <button
              type="button"
              className="btn bg-[#13ac4c] text-white"
              onClick={toLogin}
            >
              Login
            </button>
            &nbsp; or &nbsp;
            <button
              type="button"
              className="btn bg-warning text-white"
              onClick={toLogin}
            >
              Register
            </button>
          </span>
        </div>
      </div>
    </>
  );
};

export default Welcome;
