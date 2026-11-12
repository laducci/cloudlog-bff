/**
 * Testes de ARQUITETURA com ArchUnitTS (pacote npm "archunit").
 * Garantem no BFF a Clean Architecture (Domain, Application, Infrastructure, API)
 * e o isolamento das fatias verticais (Vertical Slice).
 */
import { metrics, projectFiles, projectSlices } from "archunit";

const FEATURES = ["GetAggregatedData", "ManageDeliveries", "ManageVehicles", "ManageDrivers", "QuoteFreight", "AssignDelivery"];
const imports = (content: string, pkg: string) => new RegExp(`from\\s+["']${pkg}["']`).test(content);

describe("Clean Architecture — regra de dependência", () => {
  it("as camadas seguem o diagrama permitido", async () => {
    const diagram = `
@startuml
  component [Domain]
  component [Application]
  component [Infrastructure]
  component [API]
  [Application] --> [Domain]
  [Infrastructure] --> [Domain]
  [API] --> [Application]
  [API] --> [Domain]
  [API] --> [Infrastructure]
@enduml`;
    await expect(projectSlices().definedBy("src/(**)/").should().adhereToDiagram(diagram)).toPassAsync();
  });

  it("Domain não depende de nenhuma outra camada", async () => {
    for (const layer of ["Application", "Infrastructure", "API"]) {
      await expect(projectFiles().inFolder("src/Domain/**").shouldNot().dependOnFiles().inFolder(`src/${layer}/**`)).toPassAsync();
    }
  });

  it("Application não depende de Infrastructure nem de API", async () => {
    await expect(projectFiles().inFolder("src/Application/**").shouldNot().dependOnFiles().inFolder("src/Infrastructure/**")).toPassAsync();
    await expect(projectFiles().inFolder("src/Application/**").shouldNot().dependOnFiles().inFolder("src/API/**")).toPassAsync();
  });

  it("Infrastructure não depende de Application nem de API", async () => {
    await expect(projectFiles().inFolder("src/Infrastructure/**").shouldNot().dependOnFiles().inFolder("src/Application/**")).toPassAsync();
    await expect(projectFiles().inFolder("src/Infrastructure/**").shouldNot().dependOnFiles().inFolder("src/API/**")).toPassAsync();
  });

  it("endpoints da API não acessam a Infrastructure (só o Composition Root)", async () => {
    await expect(projectFiles().inFolder("src/API/Features/**").shouldNot().dependOnFiles().inFolder("src/Infrastructure/**")).toPassAsync();
  });

  it("não há dependências circulares", async () => {
    await expect(projectFiles().inFolder("src/**").should().haveNoCycles()).toPassAsync();
  });
});

describe("Vertical Slice — isolamento das features", () => {
  for (const feature of FEATURES) {
    it(`a feature ${feature} não depende de outras features`, async () => {
      for (const other of FEATURES.filter((f) => f !== feature)) {
        await expect(
          projectFiles().inFolder(`src/Application/Features/${feature}/**`).shouldNot().dependOnFiles().inFolder(`src/Application/Features/${other}/**`),
        ).toPassAsync();
        await expect(
          projectFiles().inFolder(`src/API/Features/${feature}/**`).shouldNot().dependOnFiles().inFolder(`src/API/Features/${other}/**`),
        ).toPassAsync();
      }
    });
  }

  it("casos de uso seguem a convenção <Feature>UseCase.ts", async () => {
    await expect(projectFiles().inFolder("src/Application/Features/**").should().haveName(/^[A-Z]\w+UseCase\.ts$/)).toPassAsync();
  });

  it("endpoints seguem a convenção <feature>.endpoint.ts", async () => {
    await expect(projectFiles().inFolder("src/API/Features/**").should().haveName(/^[a-z]\w+\.endpoint\.ts$/)).toPassAsync();
  });
});

describe("Pacotes externos confinados às camadas certas", () => {
  it("express só aparece na camada API", async () => {
    const rule = projectFiles().inFolder("src/**").should().adhereTo(
      (f) => !imports(f.content, "express") || f.path.includes("src/API/"), "express só na API");
    await expect(rule).toPassAsync();
  });

  it("chamadas HTTP aos serviços (fetch) só existem em Infrastructure/Http", async () => {
    const rule = projectFiles().inFolder("src/**").should().adhereTo(
      (f) => !/fetch\(|fetchFn\(/.test(f.content) || f.path.includes("Infrastructure/Http"), "fetch só nos adaptadores HTTP");
    await expect(rule).toPassAsync();
  });

  it("o BFF não acessa banco de dados (Database per Service)", async () => {
    const rule = projectFiles().inFolder("src/**").should().adhereTo(
      (f) => !["mongodb", "mssql", "pg", "mysql2", "@azure/data-tables"].some((p) => imports(f.content, p)), "BFF sem driver de banco");
    await expect(rule).toPassAsync();
  });

  it("as regras de negócio do BFF ficam no Domain (puras, sem I/O)", async () => {
    const rule = projectFiles().inFolder("src/Domain/**").should().adhereTo(
      (f) => !/await|process\.env/.test(f.content), "domínio puro");
    await expect(rule).toPassAsync();
  });
});

describe("Métricas de código", () => {
  it("nenhum arquivo de src passa de 200 linhas", async () => {
    await expect(metrics().inFolder("src/**").count().linesOfCode().shouldBeBelow(200)).toPassAsync();
  });
});
