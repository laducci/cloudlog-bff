import { AssignDeliveryUseCase } from "../Application/Features/AssignDelivery/AssignDeliveryUseCase";
import { GetAggregatedDataUseCase } from "../Application/Features/GetAggregatedData/GetAggregatedDataUseCase";
import { ManageDeliveriesUseCase } from "../Application/Features/ManageDeliveries/ManageDeliveriesUseCase";
import { ManageDriversUseCase } from "../Application/Features/ManageDrivers/ManageDriversUseCase";
import { ManageVehiclesUseCase } from "../Application/Features/ManageVehicles/ManageVehiclesUseCase";
import { QuoteFreightUseCase } from "../Application/Features/QuoteFreight/QuoteFreightUseCase";
import { Infrastructure } from "../Infrastructure/buildInfrastructure";

/** Composition Root do BFF. */
export function composeUseCases(infra: Pick<Infrastructure, "deliveries" | "fleet" | "freight" | "clock">) {
  const { deliveries, fleet, freight, clock } = infra;
  return {
    getAggregatedData: new GetAggregatedDataUseCase({ deliveries, fleet, freight, clock }),
    manageDeliveries: new ManageDeliveriesUseCase({ deliveries }),
    manageVehicles: new ManageVehiclesUseCase({ fleet }),
    manageDrivers: new ManageDriversUseCase({ fleet }),
    quoteFreight: new QuoteFreightUseCase({ freight }),
    assignDelivery: new AssignDeliveryUseCase({ deliveries, fleet }),
  };
}

export type UseCases = ReturnType<typeof composeUseCases>;
