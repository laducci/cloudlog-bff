import { buildInfrastructure } from "../Infrastructure/buildInfrastructure";
import { createApp } from "./app";
import { composeUseCases } from "./Composition";

const infra = buildInfrastructure(process.env);
const app = createApp(composeUseCases(infra), { gateways: infra.description.gateways });
const port = Number(process.env.PORT ?? 8080);

app.listen(port, () => {
  console.log(`cloudlog-bff ouvindo na porta ${port}`, infra.description);
});
