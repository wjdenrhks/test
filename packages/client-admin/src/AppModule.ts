import "@simplism/angular/fonts/d2coding.css";
import "@simplism/angular/fonts/notosanskr.css";
import "../scss/styles.scss";

import {ApplicationRef, NgModule} from "@angular/core";
import {SdLocalStorageProvider, SdOrmProvider, SdSocketProvider, SimplismModule} from "@simplism/angular";

import {AppPage} from "./AppPage";
import {RouterModule} from "@angular/router";
import {BrowserModule, Title} from "@angular/platform-browser";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {AppSharedModule} from "./AppSharedModule";
import {HomePage} from "./pages/HomePage";
import {LoginPage} from "./pages/LoginPage";
import {MainPage} from "./pages/MainPage";
import {AppDataProvider, AppInitializer} from "@sample/client-common";
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
import {HmrAppModuleBase} from "@simplism/angular-hmr";
import {StockAdjustmentModal} from "./modals/StockAdjustmentModal";

@NgModule({
  imports: [
    ChartsModule,
    BrowserModule,
    BrowserAnimationsModule,
    SimplismModule.forRoot(),
    AppSharedModule.forRoot(),
    RouterModule.forRoot(
      [
        {path: "", redirectTo: "/login", pathMatch: "full"},
        {path: "login", component: LoginPage},
        {
          path: "home", component: HomePage, children: [
            {path: "main", component: MainPage},
            {
              path: "base-info",
              loadChildren: "./modules/BaseInfoLazyModule#BaseInfoLazyModule"
            },
            {
              path: "shipment",
              loadChildren: "./modules/ShipmentLazyModule#ShipmentLazyModule"
            },
            {
              path: "production",
              loadChildren: "./modules/ProductionLazyModule#ProductionLazyModule"
            },
            {
              path: "process",
              loadChildren: "./modules/ProcessLazyModule#ProcessLazyModule"
            },
            {
              path: "inspection",
              loadChildren: "./modules/InspectionLazyModule#InspectionLazyModule"
            },
            {
              path: "goods-transaction",
              loadChildren: "./modules/GoodsTransactionLazyModule#GoodsTransactionLazyModule"
            },
            {
              path: "document",
              loadChildren: "./modules/DocumentLazyModule#DocumentLazyModule"
            },
            {
              path: "dookwan",
              loadChildren: "./modules/DookwanLazyModule#DookwanLazyModule"
            }
          ]
        }
      ],
      {useHash: true}
    )
  ],
  declarations: [
    AppPage,
    LoginPage,
    HomePage,
    MainPage
  ],
  entryComponents: [
    AppPage,
    GoodsSearchModal,
    EquipmentSearchModal,
    StockSearchModal,
    PartnerSearchModal,
    EquipmentInfoShowModal,
    ProductionInfoEquipmentModal,
    ProductionInfoEquipDooModal,
    ProductionInstructionSearchModal,
    GoodReceiptSearchModal,
    LotSearchModal,
    StockAdjustmentModal,
    ShippingPlanSearchModal,
    BomListSearchModal,
    PrintBarcodeModal,
    ManagerRegisterModal,
    ShowManualModal,
    CombinationInputReturnModal,
    BarcodeRegisterModal,
    LdpeReturnModal,
    QualityCheckProductionSearchModal,
    ProductionSearchModal,
    ShowScrapInfoModal,
    EquipmentCapaInfoModal,
    PurchasePrintTemplate,
    MediumBarcodePrintTemplate,
    InspectionReportModal,
    BarcodePrintTemplate,
    ChartInfoModal,
    PackingBarcodePrintTemplate,
    SmallBarcodePrintTemplate,
    PackingBarcodeSearchModal,
    ProductionInfoGoodsSearchModal,
    ProductionItemDetailRegisterModal,
    GoodsInspectionCopyModal,
    GoodsProductionCopyModal,
    RawMaterialCostsViewModal
  ]
})
export class AppModule extends HmrAppModuleBase {
  public constructor(appRef: ApplicationRef,
                     private readonly _socket: SdSocketProvider,
                     private readonly _orm: SdOrmProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _localStorage: SdLocalStorageProvider,
                     private readonly _title: Title) {
    super(appRef);
  }

  public async ngDoBootstrap(): Promise<void> {
    await AppInitializer.initializeAsync(
      this._title,
      this._localStorage,
      this._socket,
      this._orm,
      this._appData
    );

    this._appRef.bootstrap(AppPage);
  }
}
