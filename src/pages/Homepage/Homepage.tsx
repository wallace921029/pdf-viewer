import { useNavigate } from "react-router";

function Homepage() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>homepage</h1>
      <button onClick={() => navigate("/pdf")}>Go to PDF Viewer</button>
    </div>
  );
}

export default Homepage;
