import { useXiangqiStore } from "../store/useXiangqiStore";

export const FileManagementBar = () => {
  const { newFile, openFile, saveFile, saveAsFile, currentFileName, isFileModified } = useXiangqiStore();

  const status = `${currentFileName}${isFileModified ? "（已修改）" : ""}`;

  return (
    <div className="file-management">
      <div className="file-management-buttons">
        <button className="btn btn-primary small-btn" onClick={newFile}>
          新建文件
        </button>
        <button className="btn btn-primary small-btn" onClick={openFile}>
          打开文件
        </button>
        <button className="btn btn-success small-btn" onClick={saveFile}>
          保存文件
        </button>
        <button className="btn btn-info small-btn" onClick={saveAsFile}>
          另存为
        </button>
      </div>
      <div className="file-status" id="fileStatus">
        {status}
      </div>
    </div>
  );
};
