import {ModuleWithProviders, NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {
  AppDataProvider,
  InputDateControl,
  InputErrorControl,
  InputUnitControl,
  GoodSelectControl,
  LotSelectControl,
  SelectWeekDaysControl,
  EmployeeSelectControl,
  ProductionEquipmentSelectControl,
  GoodsGroupMultiSelectControl, GoodNameSelectControl,
  GoodsNameSelectControl, PartnerSelectControl,
  GoodsSpecificationSelectControl
} from "@sample/client-common";
import {SimplismModule} from "@simplism/angular";
import {GoodsSearchModal} from "./modals/GoodsSearchModal";
import {ProductionInfoEquipmentModal} from "./modals/ProductionInfoEquipmentModal";
import {ProductionInfoEquipDooModal} from "./modals/ProductionInfoEquipDooModal";
import {EquipmentSearchModal} from "./modals/EquipmentSearchModal";
import {StockSearchModal} from "./modals/StockSearchModal";
import {PartnerSearchModal} from "./modals/PartnerSearchModal";
import {ManagerRegisterModal} from "./modals/ManagerRegisterModal";
import {LotSearchModal} from "./modals/LotSearchModal";
import {ProductionInstructionSearchModal} from "./modals/ProductionInstructionSearchModal";
import {GoodReceiptSearchModal} from "./modals/GoodReceiptSearchModal";
import {ShippingPlanSearchModal} from "./modals/ShippingPlanSearchModal";
import {BomListSearchModal} from "./modals/BomListSearchModal";
import {PrintBarcodeModal} from "./modals/PrintBarcodeModal";
import {CombinationInputReturnModal} from "./modals/CombinationInputReturnModal";
import {QualityCheckProductionSearchModal} from "./modals/QualityCheckProductionSearchModal";
import {LdpeReturnModal} from "./modals/LdpeReturnModal";
import {ChartsModule} from "ng2-charts";
import "chart.js";
import "chartjs-plugin-annotation";
import "fs";
import {ProductionSearchModal} from "./modals/ProductionSearchModal";
import {ShowScrapInfoModal} from "./modals/ShowScrapInfoModal";
import {EquipmentCapaInfoModal} from "./modals/EquipmentCapaInfoModal";
import {PurchasePrintTemplate} from "./print-templates/PurchasePrintTemplate";
import {ProductionInfoGoodsSearchModal} from "./modals/ProductionInfoGoodsSearchModal";
import {BarcodeRegisterModal} from "./modals/BarcodeRegisterModal";
import {BarcodePrintTemplate} from "./print-templates/BarcodePrintTemplate";
import {InspectionReportModal} from "./modals/InspectionReportModal";
import {ChartInfoModal} from "./modals/ChartInfoModal";
import {PackingBarcodeSearchModal} from "./modals/PackingBarcodeSearchModal";
import {SmallBarcodePrintTemplate} from "./print-templates/SmallBarcodePrintTemplate";
import {MediumBarcodePrintTemplate} from "./print-templates/MediumBarcodePrintTemplate";
import {PackingBarcodePrintTemplate} from "./print-templates/PackingBarcodePrintTemplate";
import {GoodsInspectionCopyModal} from "./modals/GoodsInspectionCopyModal";
import {GoodsProductionCopyModal} from "./modals/GoodsProductionCopyModal";
import {RawMaterialCostsViewModal} from "./modals/RawMaterialCostsViewModal";
import {EquipmentInfoShowModal} from "./modals/EquipmentInfoShowModal";
import {ShowManualModal} from "./modals/ShowManualModal";
import {ProductionItemDetailRegisterModal} from "./modals/ProductionItemDetailRegisterModal";
import {StockAdjustmentModal} from "./modals/StockAdjustmentModal";

const modules: any[] = [
  CommonModule,
  SimplismModule
];

const controls: any[] = [
  InputDateControl,
  InputErrorControl,
  GoodSelectControl,
  InputUnitControl,
  PartnerSelectControl,
  SelectWeekDaysControl,
  GoodNameSelectControl,
  GoodsNameSelectControl,
  GoodsSpecificationSelectControl,
  GoodsGroupMultiSelectControl,
  LotSelectControl,
  EmployeeSelectControl,
  ProductionEquipmentSelectControl
];

const modals: any[] = [
  GoodsSearchModal,
  EquipmentSearchModal,
  StockSearchModal,
  StockAdjustmentModal,
  PartnerSearchModal,
  ChartInfoModal,
  ManagerRegisterModal,
  BarcodeRegisterModal,
  ProductionInfoEquipmentModal,
  ProductionInfoEquipDooModal,
  EquipmentInfoShowModal,
  ProductionItemDetailRegisterModal,
  ProductionInstructionSearchModal,
  GoodReceiptSearchModal,
  ShippingPlanSearchModal,
  BomListSearchModal,
  PrintBarcodeModal,
  LotSearchModal,
  MediumBarcodePrintTemplate,
  LdpeReturnModal,
  CombinationInputReturnModal,
  InspectionReportModal,
  QualityCheckProductionSearchModal,
  ProductionSearchModal,
  ShowScrapInfoModal,
  EquipmentCapaInfoModal,
  PackingBarcodeSearchModal,
  ProductionInfoGoodsSearchModal,
  GoodsInspectionCopyModal,
  GoodsProductionCopyModal,
  ShowManualModal,
  RawMaterialCostsViewModal
];

const printTemplates: any[] = [
  PurchasePrintTemplate,
  BarcodePrintTemplate,
  PackingBarcodePrintTemplate,
  SmallBarcodePrintTemplate
];

const providers: any[] = [
  AppDataProvider
];

@NgModule({
  imports: [
    CommonModule,
    SimplismModule,
    ChartsModule
  ],
  declarations: [
    ...controls,
    ...modals,
    ...printTemplates
  ],
  exports: [
    ...modules,
    ...controls,
    ...modals,
    ...printTemplates
  ]
})
export class AppSharedModule {
  public static forRoot(): ModuleWithProviders {
    return {
      ngModule: AppSharedModule,
      providers
    };
  }
}
