import { TailSpin } from "react-loader-spinner";

const loadingna = () => {
  return (
    <TailSpin
      height="80"
      width="80"
      color="#641ae6"
      ariaLabel="tail-spin-loading"
      radius="1"
      wrapperStyle={{}}
      wrapperClass=""
      visible={true}
    />
  );
};

export default loadingna;
