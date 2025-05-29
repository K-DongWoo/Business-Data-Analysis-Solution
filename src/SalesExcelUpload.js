import axios from "axios";
import React, { useState, useEffect, useRef } from "react";

const KEY_TO_AMOUNT = {
  1: 4000,
  2: 6000,
  3: 8000,
  4: 10000,
  5: 12000,
  6: 15000,
  7: 20000,
  8: 25000,
  9: 30000,
  0: 50000,
};

function App() {
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [currentSales, setCurrentSales] = useState(0);
  const [logs, setLogs] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState("");
  const logsEndRef = useRef(null);

  // 날짜/시간 상태
  const [now, setNow] = useState(new Date());

  // 영업 관련 상태
  const [businessStarted, setBusinessStarted] = useState(false);
  const [closeHour, setCloseHour] = useState(20);
  const [closeMinute, setCloseMinute] = useState(0);
  const [leftSeconds, setLeftSeconds] = useState(0);
  const [showCloseEdit, setShowCloseEdit] = useState(false);
  const [closeHourInput, setCloseHourInput] = useState(closeHour);
  const [closeMinuteInput, setCloseMinuteInput] = useState(closeMinute);

  // 실시간 날짜/시간
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 영업 타이머
  useEffect(() => {
    let interval = null;
    if (businessStarted) {
      interval = setInterval(() => {
        const nowDate = new Date();
        const close = new Date(
          nowDate.getFullYear(),
          nowDate.getMonth(),
          nowDate.getDate(),
          closeHour,
          closeMinute,
          0
        );
        let diff = Math.floor((close - nowDate) / 1000);
        if (diff <= 0) {
          diff = 0;
          setBusinessStarted(false);
        }
        setLeftSeconds(diff);
      }, 1000);
    } else {
      setLeftSeconds(0);
    }
    return () => interval && clearInterval(interval);
  }, [businessStarted, closeHour, closeMinute]);

  // 주문 로그 자동 스크롤
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // 키보드 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (Object.keys(KEY_TO_AMOUNT).includes(e.key) && !editMode) {
        const amount = KEY_TO_AMOUNT[e.key];
        setCurrentSales((prev) => prev + amount);

        // 주문 로그 추가
        const now = new Date();
        const formattedTime = `${now.getFullYear()}.${String(
          now.getMonth() + 1
        ).padStart(2, "0")}.${String(now.getDate()).padStart(
          2,
          "0"
        )} - ${String(now.getHours()).padStart(2, "0")}:${String(
          now.getMinutes()
        ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

        setLogs((prevLogs) => [
          ...prevLogs,
          {
            orderNo: String(prevLogs.length + 1).padStart(3, "0"),
            amount,
            time: formattedTime,
          },
        ]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editMode]);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        process.env.REACT_APP_API_SERVER + "predict-from-excel",
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

  // 현재 매출액 수정 관련 함수
  const handleEditClick = () => {
    setEditValue(currentSales.toString());
    setEditMode(true);
  };

  const handleEditChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setEditValue(value);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const value = parseInt(editValue, 10);
    if (!isNaN(value)) {
      setCurrentSales(value);
    }
    setEditMode(false);
  };

  // 영업 개시 버튼
  const handleStartBusiness = () => {
    setBusinessStarted(true);
  };

  // 영업 시간 설정 버튼
  const handleShowCloseEdit = () => {
    setCloseHourInput(closeHour);
    setCloseMinuteInput(closeMinute);
    setShowCloseEdit(true);
  };

  // 영업 종료 시각 입력 핸들러
  const handleCloseHourChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setCloseHourInput(val === "" ? "" : Math.min(23, parseInt(val, 10)));
  };
  const handleCloseMinuteChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setCloseMinuteInput(val === "" ? "" : Math.min(59, parseInt(val, 10)));
  };

  // 영업 종료 시각 설정 저장
  const handleCloseEditSubmit = (e) => {
    e.preventDefault();
    setCloseHour(closeHourInput === "" ? 0 : closeHourInput);
    setCloseMinute(closeMinuteInput === "" ? 0 : closeMinuteInput);
    setShowCloseEdit(false);
    setBusinessStarted(false); // 시간 바뀌면 영업 재시작 필요
  };

  // 시간 포맷 (00:00:00)
  const formatTime = (sec) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // 오늘 날짜 포맷 (월.일 - 시:분:초)
  const formatNow = (date) => {
    return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(
      date.getDate()
    ).padStart(2, "0")} - ${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
  };

  // 오른쪽 대시보드 ref (물이 차오르는 효과에 사용)
  const dashboardRef = useRef(null);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "sans-serif",
        background: "#f6f8fa",
      }}
    >
      {/* 왼쪽 주문 로그 영역 */}
      <div
        style={{
          width: 320,
          borderRight: "1px solid #ddd",
          padding: 24,
          background: "#fafafa",
          overflowY: "auto",
        }}
      >
        <h2 style={{ marginTop: 0 }}>주문 로그</h2>
        {logs.length === 0 && (
          <p style={{ color: "#aaa" }}>주문 로그가 없습니다.</p>
        )}
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {logs.map(({ orderNo, amount, time }, idx) => (
            <li
              key={idx}
              style={{
                marginBottom: 16,
                paddingBottom: 10,
                borderBottom: "1px solid #eee",
              }}
            >
              <div>
                <b>{orderNo}</b> - {amount.toLocaleString()}원
              </div>
              <div style={{ fontSize: 12, color: "#666" }}>{time}</div>
            </li>
          ))}
          <div ref={logsEndRef} />
        </ul>
      </div>

      {/* 오른쪽 대시보드 영역 */}
      <div
        ref={dashboardRef}
        style={{
          flex: 1,
          padding: 40,
          position: "relative",
          overflow: "hidden",
          background: "#f6f8fa",
        }}
      >
        {/* 물이 차오르는 효과 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: "100%",
            height: `${getPercent()}%`,
            background: "linear-gradient(0deg, #63b3ed 0%, #3182ce 100%)",
            opacity: 0.23,
            transition: "height 0.8s cubic-bezier(0.4,0,0.2,1)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        {/* 상단 날짜/영업 타이머/설정 */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: 80,
            display: "flex",
            alignItems: "center",
            gap: 24,
            padding: "0 0 0 360px",
            zIndex: 2,
          }}
        >
          {/* 날짜와 남은 영업 시간을 세로로 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 600 }}>
              {formatNow(now)}
            </div>
            {businessStarted && (
              <div
                style={{
                  fontSize: 18,
                  color: "#3182ce",
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                남은 시간: {formatTime(leftSeconds)}
              </div>
            )}
          </div>
          {/* 버튼들 */}
          <button
            onClick={handleStartBusiness}
            disabled={businessStarted}
            style={{
              marginLeft: 8,
              padding: "8px 18px",
              background: "#3182ce",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: businessStarted ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            영업 개시
          </button>
          <button
            onClick={handleShowCloseEdit}
            style={{
              padding: "8px 14px",
              background: "#eee",
              color: "#333",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            영업 시간 설정
          </button>
        </div>

        {/* 영업 종료 시간 설정 폼 */}
        {showCloseEdit && (
          <div
            style={{
              position: "absolute",
              top: 90,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#fff",
              padding: 28,
              borderRadius: 12,
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              zIndex: 10,
            }}
          >
            <form
              onSubmit={handleCloseEditSubmit}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <span style={{ fontWeight: 600 }}>영업 종료 시각:</span>
              <input
                type="number"
                min={0}
                max={23}
                value={closeHourInput}
                onChange={handleCloseHourChange}
                style={{ width: 60, fontSize: 18, textAlign: "center" }}
              />{" "}
              시
              <input
                type="number"
                min={0}
                max={59}
                value={closeMinuteInput}
                onChange={handleCloseMinuteChange}
                style={{ width: 60, fontSize: 18, textAlign: "center" }}
              />{" "}
              분
              <button
                type="submit"
                style={{
                  marginLeft: 8,
                  padding: "6px 18px",
                  background: "#3182ce",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 16,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                확인
              </button>
            </form>
          </div>
        )}

        {/* 대시보드 본문 */}
        <div
          style={{
            marginTop: 100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 2,
            position: "relative",
          }}
        >
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
              <div
                style={{
                  fontSize: 40,
                  color: "#3182ce",
                  fontWeight: "bold",
                  marginTop: 8,
                }}
              >
                {prediction.toLocaleString()} 원
              </div>
              <div style={{ fontSize: 16, color: "#666", marginTop: 24 }}>
                현재 매출액: <b>{currentSales.toLocaleString()} 원</b>
                {!editMode && (
                  <button
                    onClick={handleEditClick}
                    style={{
                      marginLeft: 12,
                      padding: "4px 12px",
                      fontSize: 14,
                      background: "#eee",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    현재 매출액 수정
                  </button>
                )}
              </div>
              {/* 수정 입력창 */}
              {editMode && (
                <form onSubmit={handleEditSubmit} style={{ marginTop: 12 }}>
                  <input
                    type="text"
                    value={editValue}
                    onChange={handleEditChange}
                    style={{
                      width: 120,
                      padding: "6px 8px",
                      fontSize: 16,
                      border: "1px solid #ccc",
                      borderRadius: 4,
                    }}
                    autoFocus
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  <button
                    type="submit"
                    style={{
                      marginLeft: 8,
                      padding: "6px 16px",
                      fontSize: 16,
                      background: "#3182ce",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    확인
                  </button>
                </form>
              )}
              {/* 게이지 바 */}
              <div style={{ marginTop: 24, textAlign: "left" }}>
                <div
                  style={{
                    background: "#eee",
                    borderRadius: 20,
                    height: 28,
                    width: "100%",
                    overflow: "hidden",
                    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)",
                  }}
                >
                  <div
                    style={{
                      width: `${getPercent()}%`,
                      background:
                        "linear-gradient(90deg, #3182ce 60%, #63b3ed 100%)",
                      height: "100%",
                      transition: "width 0.7s",
                      borderRadius: 20,
                    }}
                  />
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 14,
                    color: "#3182ce",
                    fontWeight: "bold",
                  }}
                >
                  {Math.round(getPercent())}% 달성
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
