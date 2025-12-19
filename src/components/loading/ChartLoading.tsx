import LoadingTemplate from "./loading-template/LoadingTemplate";

const ChartLoading = () => {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
      <LoadingTemplate />
    </div>
  );
};

export default ChartLoading;
