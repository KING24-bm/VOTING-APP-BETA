export default function RotatingBackground() {
  return (
    <>
      <div
        className="rotating-bg"
        style={{ backgroundImage: "url('/assets/ESNC LOGO BG.PNG')" }}
      />

      <style>
        {`
        .rotating-bg {
          position: fixed;
          inset: 0;
          background-repeat: no-repeat;
          background-position: center;
          background-size: 650px;
          opacity: 0.08;
          animation: rotateBg 60s linear infinite;
          pointer-events: none;
          z-index: 0;
        }

        @keyframes rotateBg {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        `}
      </style>
    </>
  );
}