import app from "./configs/app";
import config from "./configs/config";

const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
