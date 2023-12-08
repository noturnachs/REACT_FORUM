import DashboardNav from "./DashboardNav";
import StoreBody from "./StoreBody";

const Store = () => {
  document.title = `TCC - Store`;
  return (
    <>
      <DashboardNav />
      <StoreBody />
    </>
  );
};

export default Store;
