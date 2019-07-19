import {SdModalBase, SdModalProvider, SdOrmProvider, SdPrintProvider, SdToastProvider} from "@simplism/angular";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {EquipmentByGoods, MainDbContext} from "@sample/main-database";
import {GoodsSearchModal} from "./GoodsSearchModal";
import {BarcodePrintTemplate} from "../print-templates/BarcodePrintTemplate";

@Component({
  selector: "app-barcode-register-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-dock-container style="min-width: 350px;">
      <sd-pane>
        <div>
          <sd-form [inline]="true" style="margin-top: 10px; margin-bottom: 10px; margin-left: 10px;">
            <sd-form-item [label]="' 타 입'">
              <sd-select [(value)]="items.type">
                <sd-select-item [value]="'생산'">생산</sd-select-item>
                <sd-select-item [value]="'입고'">입고</sd-select-item>
                <sd-select-item [value]="'반품'">반품</sd-select-item>
                <sd-select-item [value]="'출고'">출고</sd-select-item>
              </sd-select>
            </sd-form-item>
            <sd-form-item [label]="'설 비'" *ngIf="items && items.type === '생산'">
              <sd-select [(value)]="items.equipmentId">
                <sd-select-item *ngFor="let equipment of equipmentList; trackBy: trackByIdFn"
                                [value]="equipment.id">
                  {{ equipment.name }}
                </sd-select-item>
              </sd-select>
            </sd-form-item>
            <br>
            <sd-form-item [label]="'품목명'">
              <sd-textfield [(value)]="items.goodName" [disabled]="true" style="width: 190px;"></sd-textfield>
            </sd-form-item>
            <a (click)="productionPlanGoodsSearchModalOpenButtonClick()">
              <sd-icon [fixedWidth]="true" [icon]="'search'"></sd-icon>
            </a>
            <br>
            <sd-form-item [label]="'발급량'">
              <sd-textfield [(value)]="items.startCount" [type]="'number'" style="width: 80px;"></sd-textfield>
            </sd-form-item>
            ~
            <sd-form-item style="width: 80px;">
              <sd-textfield [(value)]="items.endCount" [type]="'number'"></sd-textfield>
            </sd-form-item>
          </sd-form>
        </div>
      </sd-pane>
      <sd-dock [position]="'bottom'">
        <sd-button [type]="'submit'" [theme]="'primary'" (click)="onPrintButtonClick()">
          <sd-icon [icon]="'print'"></sd-icon>
          바코드 출력
        </sd-button>
      </sd-dock>
    </sd-dock-container>
  `
})
export class BarcodeRegisterModal extends SdModalBase<{ type?: string }, any> {
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

  public equipmentList: {
    id: number;
    name: string;
    code: string;
    isDisabled: boolean;
  }[] = [];

  public trackByIdFn(item: any): number {
    return item.id;
  }

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _print: SdPrintProvider,
                     private readonly _cdr: ChangeDetectorRef,
                     private readonly _appData: AppDataProvider,
                     private readonly _modal: SdModalProvider,
                     private readonly _toast: SdToastProvider) {
    super();
  }

  public async sdOnOpen(param: { type?: any }): Promise<void> {
    this.busyCount++;

    this.items = {
      id: undefined,
      type: param.type,
      startCount: 1,
      endCount: 1,
      equipmentId: undefined,
      equipmentCode: undefined,
      lot: undefined,
      goodId: undefined,
      goodName: undefined
    };

    await this._orm.connectAsync(MainDbContext, async db => {
      this.equipmentList = await db.equipment
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.isDisabled, false)
        ])
        .select(item => ({
          id: item.id!,
          name: item.name,
          code: item.code!,
          isDisabled: item.isDisabled
        }))
        .resultAsync();
    });

    this.busyCount--;
    this._cdr.markForCheck();
  }

  public async productionPlanGoodsSearchModalOpenButtonClick(): Promise<void> {
    const result = await this._modal.show(GoodsSearchModal, "품목 검색", {isMulti: false});
    if (!result) return;

    this.items!.goodId = result.id;
    this.items!.goodName = result.name;

    this._cdr.markForCheck();
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.pagination.page = 0;
    this.lastFilter = Object.clone(this.filter);
    await this._search();
  }

  public async onPageClick(page: number): Promise<void> {
    this.pagination.page = page;
    await this._search();
  }

  public async onPrintButtonClick(): Promise<void> {
    if (!this.items!.goodId) {
      this._toast.danger("품목을 선택해 주세요.");
      return;
    }

    if (this.items!.type === "생산" && !this.items!.equipmentId) {
      this._toast.danger("설비를 선택해 주세요.");
      return;
    }

    if (!this.items!.startCount || !this.items!.endCount) {
      this._toast.danger("출력 범위를 정확히 입력해 주세요.");
      return;
    }

    //TODO: 출력 바코드 생성 템플릿 & 로직 수정해야 함
    const seq = (this.items!.endCount! - this.items!.startCount!) + 1;
    if (!confirm("출력 바코드는 총 " + seq + "개 입니다. \n진행하시겟습니까?")) return;
    await this._print.print(BarcodePrintTemplate, this.items);

    /* try {
       await this._orm.connectAsync(MainDbContext, async db => {
         for (let i = 1; i <= seq; i++) {

         }
       });
     }*/
  }

  public async onSaveButtonClick(): Promise<void> {
    await this._save();
    this._cdr.markForCheck();
  }

  private async _save(): Promise<void> {

  }

  private async _search(): Promise<void> {
    this.busyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        const queryable = this._getSearchQueryable(db);

        const totalCount = await queryable.countAsync();
        this.pagination.length = Math.ceil(totalCount / 20);
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }
    finally {
      this.busyCount--;
      this._cdr.markForCheck();

    }
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<EquipmentByGoods> {
    return db.equipmentByGoods
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.equal(item.goodId, this.lastFilter!.goodId)
      ]);
  }
}

interface IPrintBarcodeModalVM {
  id: number | undefined;
  type: "생산" | "입고" | "반품" | "출고" | "기타";
  startCount: number | undefined;
  endCount: number | undefined;
  equipmentId: number | undefined;
  equipmentCode: string | undefined;
  lot: string | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
}
