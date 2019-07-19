import {SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {AppDataProvider} from "@sample/client-common";
import {MainDbContext, StockProc} from "@sample/main-database";
import {DateOnly, DateTime} from "@simplism/core";
import {IStockWarehouseCurrentVM} from "../modules/goods-transaction/StockWarehouseCurrentPage";

@Component({
  selector: "app-stock-adjust-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-dock-container style="min-width: 400px;">
      <sd-pane>
        <div>
          <sd-form [inline]="true" style="margin-top: 10px; margin-bottom: 10px; margin-left: 10px;">
            <sd-form-item [label]="'LOT'">
              <sd-textfield [(value)]="items.lotName" [disabled]="true"></sd-textfield>
            </sd-form-item>
            <br>
            <sd-form-item [label]="'조정일'">
              <sd-textfield [(value)]="items.adjustDate" [type]="'date'"></sd-textfield>
            </sd-form-item>
            <!--<sd-form-item [label]="'품목명 / 규격 '">
              <div class="sd-padding-xs-sm">
                {{ items.goodName  + ' / ' + items.specification }}
              </div>
            </sd-form-item>-->
            <br>
            <sd-form-item [label]="'기존수량'">
              <sd-textfield [(value)]="items.fromQuantity" [type]="'number'" [disabled]="true"
                            style="width: 80px;"></sd-textfield>
            </sd-form-item>
            &nbsp;
            <sd-form-item [label]="'변경수량'">
              <sd-textfield [(value)]="items.toQuantity" [type]="'number'" style="width: 80px;"></sd-textfield>
            </sd-form-item>
            <br>
            <sd-form-item [label]="'비고'">
              <sd-textfield [(value)]="items.remark"></sd-textfield>
            </sd-form-item>

          </sd-form>
        </div>
      </sd-pane>
      <sd-dock [position]="'bottom'">
        <sd-button [type]="'submit'" [theme]="'primary'" (click)="onSaveButtonClick()">
          저장
        </sd-button>
      </sd-dock>
    </sd-dock-container>
  `
})
export class StockAdjustmentModal extends SdModalBase<IStockWarehouseCurrentVM, any> {
  public filter: {
    goodId?: number;
  } = {};

  public lastFilter?: {
    goodId?: number;
  };

  public pagination = {
    page: 0,
    length: 0
  };

  public items?: IPrintBarcodeModalVM;

  public busyCount = 0;

  public trackByIdFn(item: any): number {
    return item.id;
  }

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _cdr: ChangeDetectorRef,
                     private readonly _appData: AppDataProvider,
                     private readonly _toast: SdToastProvider) {
    super();
  }

  public async sdOnOpen(param: IStockWarehouseCurrentVM): Promise<void> {
    this.busyCount++;

    this.items = {
      id: undefined,
      adjustDate: new DateOnly(),
      lotId: param.lotId,
      lotName: param.lotName,
      goodId: param.goodId,
      goodRating: param.goodRating,
      goodName: param.goodName,
      specification: param.specification,
      warehouseId: param.warehouseId,
      warehouseName: param.warehouseName,
      fromQuantity: param.realStockQuantity,
      toQuantity: undefined,
      remark: undefined
    };

    this.busyCount--;
    this._cdr.markForCheck();
  }

  public async onSaveButtonClick(): Promise<void> {
    await this._save();
    this._cdr.markForCheck();
  }

  private async _save(): Promise<void> {
    if (!this.items!.adjustDate) {
      this._toast.danger("조정일을 입력해 주세요.");
      return;
    }

    if (!this.items!.toQuantity) {
      this._toast.danger("조정수량을 입력해 주세요.");
      return;
    }

    this.busyCount++;

    try {

      await this._orm.connectAsync(MainDbContext, async db => {
        await db.stockAdjustment
          .insertAsync({
            companyId: this._appData.authInfo!.companyId,
            dueDate: this.items!.adjustDate!,
            lotId: this.items!.lotId!,
            goodsId: this.items!.goodId!,
            goodsRating: this.items!.goodRating!,
            warehouseId: this.items!.warehouseId!,
            fromQuantity: this.items!.fromQuantity!,
            toQuantity: this.items!.toQuantity!,
            remark: this.items!.remark,
            createdByEmployeeId: this._appData.authInfo!.employeeId,
            createdAtDateTime: new DateTime()
          });

        await StockProc.modifyStock(db, this._appData.authInfo!.companyId, this.items!.goodId!, this.items!.fromQuantity, this.items!.lotId, this.items!.warehouseId, "-", this.items!.goodRating);
        await StockProc.modifyStock(db, this._appData.authInfo!.companyId, this.items!.goodId!, this.items!.toQuantity, this.items!.lotId, this.items!.warehouseId, "+", this.items!.goodRating);
        await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, this.items!.goodId!, this.items!.fromQuantity, "-");
        await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, this.items!.goodId!, this.items!.toQuantity, "+");
      });

      this._toast.success("저장되었습니다.");
      this.close(true);
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.busyCount--;

  }
}

interface IPrintBarcodeModalVM {
  id: number | undefined;
  adjustDate: DateOnly | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  goodName: string | undefined;
  goodId: number | undefined;
  goodRating: "A" | "B" | "C" | "공통" | undefined;
  specification: string | undefined;
  warehouseId: number | undefined;
  warehouseName: string | undefined;
  fromQuantity: number | undefined;
  toQuantity: number | undefined;
  remark: string | undefined;
}
