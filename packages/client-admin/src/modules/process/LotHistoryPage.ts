import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from "@angular/core";
import {SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {
  GoodsIssueGoods, GoodsReceipt,
  MainDbContext,
  ProductionItem, Stock
} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-lot-history",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>LOT 이력조회</h4>
          
          <sd-topbar-menu *ngIf="items" (click)="onDownloadButtonClick()">
            <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
            다운로드
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onShowManualButtonClick()" style="float: right; padding-right: 25px;">
            <sd-icon [icon]="'atlas'" [fixedWidth]="true"></sd-icon>
            메뉴얼 보기
          </sd-topbar-menu>
        </sd-topbar>

        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'LOT'">
                <sd-textfield [(value)]="lot"></sd-textfield>
              </sd-form-item>
              <sd-form-item>
                <sd-button [type]="'submit'" [theme]="'primary'">
                  <sd-icon [icon]="'search'" [fixedWidth]="true"></sd-icon>
                  조회
                </sd-button>
              </sd-form-item>
            </sd-form>
          </sd-dock>

          <sd-busy-container [busy]="mainBusyCount > 0">
            <sd-dock-container>
              <sd-dock [position]="'top'"
                       [id]="'production-history'">
                <sd-dock-container class="sd-background-default">
                  <sd-dock class="sd-padding-xs-sm">
                    <h5 style="display: inline-block; padding-right: 1.4em;">생산제품</h5>
                  </sd-dock>

                  <sd-sheet [id]="'production-history'"
                            [items]="items && items.productionList"
                            [trackBy]="trackByIdFn" *ngIf="items && items.productionList">
                    <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm" style="text-align: center;">
                          <span *ngIf="item.id">{{ item.id }}</span>
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'제품구분'" [width]="100">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm">
                          {{ item.goodType }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'출하LOT'">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm">
                          {{ item.shippingLot }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'출하ID'" [width]="70">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm">
                          {{ item.shippingId ? "#" + item.shippingId : "" }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'생산LOT'">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm">
                          {{ item.productionLot }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'제품코드'" [width]="70">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm">
                          {{ item.goodCode }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'제품명'">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm">
                          {{ item.goodName }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'규격'">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm">
                          {{ item.specification }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'생산일지ID'" [width]="90">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm">
                          {{ item.productionId ? "#" + item.productionId : "" }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'품질검사ID'" [width]="90">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm">
                          {{ item.inspectionId ? "#" + item.inspectionId : "" }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'생산실적'">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm" style="text-align: center;">
                          <a *ngIf="!!item.instructionId"
                             (click)="onSearchProductionInstructionClick(item.instructionId)">
                            #생산실적
                          </a>
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'재고현황'">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm" style="text-align: center;">
                          <a *ngIf="!!item.productionInstructionCode"
                             (click)="onSearchStockClick(item.productionInstructionCode)">
                            #재고현황
                          </a>
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                  </sd-sheet>

                </sd-dock-container>
              </sd-dock>
              <sd-dock [id]="'return-history'">
                <sd-dock-container class="sd-background-default">
                  <sd-dock class="sd-padding-xs-sm">
                    <h5 style="display: inline-block; padding-right: 1.4em;">반품 이력</h5>
                  </sd-dock>
                  <sd-pane>
                    <sd-sheet [id]="'return-history'"
                              [items]="items && items.returnList"
                              [trackBy]="trackByIdFn" *ngIf="items && items.returnList">
                      <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm" style="text-align: center;">
                            <span *ngIf="item.id">{{ item.id }}</span>
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'반품이전LOT'" [width]="130">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.returnLot }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'반품검사'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.returnInspectionId }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'품질검사'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            {{ item.returnLotQualityCheckId }}
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'생산일지'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm" style="text-align: center;">
                            <a *ngIf="!!item.returnLotProductionInstruction"
                               (click)="onSearchProductionInstructionClick(item.returnLotProductionInstruction)">
                              #생산일지
                            </a>
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'재고'">
                        <ng-template #item let-item="item">
                          <div class="sd-padding-xs-sm">
                            <a *ngIf="!!item.productionInstructionCode"
                               (click)="onSearchStockClick(item.productionInstructionCode)">
                              #재고현황
                            </a>
                          </div>
                        </ng-template>
                      </sd-sheet-column>
                    </sd-sheet>
                  </sd-pane>
                </sd-dock-container>
              </sd-dock>
              <sd-dock [id]="'input-history'">
                <sd-dock-container class="sd-background-default">
                  <sd-dock class="sd-padding-xs-sm">
                    <h5 style="display: inline-block; padding-right: 1.4em;">투입 자재이력</h5>
                  </sd-dock>
                  <sd-sheet [id]="'input-history'"
                            [items]="items && items.inputGoodsList"
                            [trackBy]="trackByIdFn" *ngIf="items && items.inputGoodsList">
                    <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm" style="text-align: center;">
                          <span *ngIf="item.id">{{ item.id }}</span>
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'투입층'" [width]="80">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm" style="text-align: center;">
                          {{ item.type }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'자재LOT'" [width]="110">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm">
                          {{ item.lotName }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'자재명'">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm">
                          {{ item.goodName }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'자재규격'">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm">
                          {{ item.specification }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'수량'">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm">
                          {{ item.quantity | number }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'재고현황'">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm">
                          {{ item.stockQuantity | number }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                    <sd-sheet-column [header]="'수입검사'">
                      <ng-template #item let-item="item">
                        <div class="sd-padding-xs-sm">
                          {{ item.inspectionId ? "#" + item.inspectionId : "" }}
                        </div>
                      </ng-template>
                    </sd-sheet-column>
                  </sd-sheet>
                </sd-dock-container>
              </sd-dock>
            </sd-dock-container>
          </sd-busy-container>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`
})
export class LotHistoryPage implements OnInit {

  public lot?: string;

  public items?: ILotHistoryVM;

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _modal: SdModalProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }


  public async ngOnInit(): Promise<void> {

    this.lot = undefined;

    this.items = {
      productionList: undefined,
      returnList: undefined,
      inputGoodsList: undefined
    };

    this.mainBusyCount++;
    await this.onSearchFormSubmit();
    this.mainBusyCount--;

    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "LOT 이력조회 메뉴얼", {type: "lot-history"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public async onSearchProductionInstructionClick(id: number): Promise<void> {
    window.open(location.pathname + "#" + `/home/production/production-instruction;id=${JSON.stringify(id)}`, "_blank", "left= 500, top= 200 width= 1000, height= 700");
  }

  public async onSearchStockClick(code: string): Promise<void> {
    window.open(location.pathname + "#" + `/home/goods-transaction/stock-warehouse-current;id=${JSON.stringify(code)}`, "_blank", "left= 500, top= 200 width= 1000, height= 700");
  }

  public async onDownloadButtonClick(): Promise<void> {
    alert("개발 중 입니다.");
  }

  public async onSearchFormSubmit(): Promise<void> {
    await this._search();
    this._cdr.markForCheck();
  }

  private async _search(): Promise<void> {

    if (!this.lot) return;

    this.lot = this.lot.trim();
    this.mainBusyCount++;
    try {
      this.items = {
        productionList: undefined,
        returnList: undefined,
        inputGoodsList: undefined
      };

      await this._orm.connectAsync(MainDbContext, async db => {
        // 생산제품 가져요기
        const production = await db.productionItem
          .include(item => item.lot)
          .include(item => item.goods)
          .include(item => item.production)
          .include(item => item.production!.instruction)
          .include(item => item.production!.instruction!.combination)
          .include(item => item.production!.instruction!.combination!.inputHistory)
          .include(item => item.production!.instruction!.combination!.inputHistory![0].lot)
          .where(item => [
            sorm.or([
              sorm.equal(item.production!.instruction!.combination!.inputHistory![0].lot!.lot, this.lot),
              sorm.equal(item.lot!.lot, this.lot)
            ])
          ])
          .join(
            GoodsIssueGoods,
            "shippingInfo",
            (qb, en) => qb
              .include(item => item.goodsIssue)
              .where(item => [
                sorm.equal(item.lotId, en.lotId)
              ])
              .select(item => ({
                shippingLot: item.goodsIssue!.code,
                shippingId: item.goodsIssueId
              })),
            true
          )
          .select(item => ({
            id: item.id,
            goodType: item.goods!.type,
            shippingLot: sorm.ifNull(item.shippingInfo!.shippingLot, undefined),
            shippingId: item.shippingInfo!.shippingId,
            productionLot: item.lot!.lot,
            goodId: item.goodId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            productionId: item.productionId,
            instructionId: item.production!.instructionId,
            inspectionId: item.production!.inspectionId,
            productionInstructionCode: item.production!.productionOrderCode
          }))
          .wrap()
          .resultAsync();

        if (!!production && production.length > 0) {
          this.items!.productionList = Object.clone(production);
        }

        // 반품 이력 가져오기
        const returnInfo = await db.goodsReceipt
          .include(item => item.previousLot)
          .include(item => item.receiptLot)
          .include(item => item.goods)
          .where(item => [
            sorm.equal(item.receiptLot!.lot, this.lot)
          ])
          .join(
            ProductionItem,
            "productionInfo",
            (qb, en) => qb
              .include(item => item.lot)
              .include(item => item.production)
              .where(item => [
                sorm.equal(item.lot!.lot, en.previousLot!.lot)
              ])
              .select(item => ({
                instructionId: item.production!.instructionId,
                instructionCode: item.production!.productionOrderCode
              })),
            true
          )
          .select(item => ({
            id: item.id,
            returnLot: item.previousLot!.lot,
            returnInspectionId: item.receiptInspectionId,
            returnLotQualityCheckId: item.qcInspectionId,
            returnLotProductionInstruction: item.productionInfo!.instructionId,
            productionInstructionCode: item.productionInfo!.instructionCode
          }))
          .resultAsync();

        if (!!returnInfo && returnInfo.length > 0) {
          this.items!.returnList = Object.clone(returnInfo);
        }

        // 투입 자재 이력 가져오기
        const inputInfo = await db.inputHistory
          .include(item => item.mixingProcess)
          .include(item => item.lot)
          .include(item => item.goods)
          .include(item => item.mixingProcess!.productionInstruction)
          .include(item => item.mixingProcess!.productionInstruction!.production)
          .include(item => item.mixingProcess!.productionInstruction!.production!.productionItem)
          .include(item => item.mixingProcess!.productionInstruction!.production!.productionItem![0].lot)
          .join(
            Stock,
            "stockInfo",
            (qb, en) => qb
              .include(item => item.lot)
              .where(item => [
                sorm.equal(item.lot!.lot, this.lot)
              ])
              .select(item => ({
                quantity: sorm.sum(sorm.ifNull(item.quantity, 0))
              })),
            true
          )
          .join(
            GoodsReceipt,
            "inspectionInfo",
            (qb, en) => qb
              .include(item => item.qcInstruction)
              .include(item => item.qcInstruction!.inspectionDetails)
              .include(item => item.qcInstruction!.inspectionDetails![0].lot)
              .include(item => item.receiptInstruction)
              .include(item => item.receiptInstruction!.lot)
              .where(item => [
                sorm.or([
                  sorm.equal(item.qcInstruction!.inspectionDetails![0].lot!.lot, this.lot),
                  sorm.equal(item.receiptInstruction!.lot!.lot, this.lot)
                ])
              ])
              .select(item => ({
                type: item.typeId,
                inspectionId: sorm.ifNull(item.qcInstruction!.id, item.receiptInstruction!.id)
              })),
            true
          )
          .where(item => [
            sorm.or([
              sorm.equal(item.mixingProcess!.productionInstruction!.production!.productionItem![0].lot!.lot, this.lot),
              sorm.equal(item.lot!.lot, this.lot)
            ])
          ])
          .select(item => ({
            id: item.id,
            type: item.type,
            lotId: item.lotId,
            lotName: item.lot!.lot,
            goodId: item.goodsId,
            goodName: item.goods!.name,
            specification: item.goods!.specification,
            quantity: item.quantity,
            stockQuantity: item.stockInfo!.quantity,
            inspectionType: item.inspectionInfo!.type,
            inspectionId: item.inspectionInfo!.inspectionId
          }))
          .wrap()
          .resultAsync();

        if (!!inputInfo && inputInfo.length > 0) {
          this.items!.inputGoodsList = Object.clone(inputInfo);
        }

        this._cdr.markForCheck();
      });
    }

    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;

  }
}

interface ILotHistoryVM {
  productionList: IProductionListVM[] | undefined;
  returnList: IReturnListVM[] | undefined;
  inputGoodsList: InputGoodsListVM[] | undefined;
}

interface IProductionListVM {
  id: number | undefined;
  goodType: string | undefined;
  shippingLot: string | undefined;
  shippingId: number | undefined;
  productionLot: string | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  productionId: number | undefined;
  instructionId: number | undefined;
  inspectionId: number | undefined;
  productionInstructionCode: string | undefined;
}

interface IReturnListVM {
  id: number | undefined;
  returnLot: string | undefined;
  returnInspectionId: number | undefined;
  returnLotQualityCheckId: number | undefined;
  returnLotProductionInstruction: number | undefined;
  productionInstructionCode: string | undefined;
}

interface InputGoodsListVM {
  id: number | undefined;
  type: "내층" | "중층" | "외층";
  lotId: number | undefined;
  lotName: string | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  specification: string | undefined;
  quantity: number | undefined;
  stockQuantity: number | undefined;
  inspectionType: number | undefined;
  inspectionId: number | undefined;
}
