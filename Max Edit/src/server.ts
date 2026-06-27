import "dotenv/config";
import app from "./index";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Max Edit API running on port ${PORT}`);
});
