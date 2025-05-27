import axios from "axios";
import React, { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState(null);

  // 임시 현재 매출액 (실제 데이터 연동 시 이 값을 바꿔주세요)
  const currentSales = 500000;

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:8000/predict-from-excel/",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setPrediction(Math.round(res.data["예측 매출액"]));
    } catch (err) {
      console.log("에러:", err);
    }
  };

  // 게이지 바 퍼센트 계산 (최대 100%)
  const getPercent = () => {
    if (!prediction) return 0;
    const percent = (currentSales / prediction) * 100;
    return percent > 100 ? 100 : percent;
  };

  return (
    <div style={{ fontFamily: "sans-serif", padding: 40, background: "#f6f8fa", minHeight: "100vh" }}>
      <h1 style={{ color: "#2d3748" }}>매출 예측 대시보드</h1>
      <input type="file" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        style={{
          marginLeft: 10,
          padding: "8px 16px",
          background: "#3182ce",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        업로드 및 예측
      </button>

      {prediction !== null && (
        <div
          style={{
            marginTop: 40,
            padding: 32,
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            textAlign: "center",
            maxWidth: 400,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <div style={{ fontSize: 18, color: "#888" }}>예측 매출액</div>
          <div style={{ fontSize: 40, color: "#3182ce", fontWeight: "bold", marginTop: 8 }}>
            {prediction.toLocaleString()} 원
          </div>
          <div style={{ fontSize: 16, color: "#666", marginTop: 24 }}>
            현재 매출액: <b>{currentSales.toLocaleString()} 원</b>
          </div>
          {/* 게이지 바 */}
          <div style={{ marginTop: 24, textAlign: "left" }}>
            <div style={{
              background: "#eee",
              borderRadius: 20,
              height: 28,
              width: "100%",
              overflow: "hidden",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)"
            }}>
              <div style={{
                width: `${getPercent()}%`,
                background: "linear-gradient(90deg, #3182ce 60%, #63b3ed 100%)",
                height: "100%",
                transition: "width 0.7s",
                borderRadius: 20
              }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: "#3182ce", fontWeight: "bold" }}>
              {Math.round(getPercent())}% 달성
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
