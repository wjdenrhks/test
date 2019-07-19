import {SdModalBase, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {MainDbContext, ProductionItem, StockProc} from "@sample/main-database";
import {ChangeDetectionStrategy, ChangeDetectorRef, Component} from "@angular/core";
import {sorm} from "@simplism/orm-query";
import {Queryable} from "@simplism/orm-client";

@Component({
  selector: "app-production-item-detail-register-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="busyCount > 0">
      <sd-dock-container style="min-width: 720px;">
        <sd-dock class="sd-padding-sm-default" [position]="'bottom'" style="text-align: right; padding-right: 20px;">
          <sd-form [inline]="true" (submit)="onSaveButtonClick()">
            <sd-form-item>
              <sd-button [type]="'submit'">
                <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
                저장
              </sd-button>
            </sd-form-item>
          </sd-form>
        </sd-dock>

        <sd-pane>
          <div class="sd-padding-default">
            <sd-grid style="padding-left: 15px; padding-right: 15px;">
              <sd-grid-item [width]="'35%'" style="padding-left: 10px; padding-right: 10px;">
                <sd-form>
                  <sd-form-item [label]="'길이'">
                    <sd-textfield [type]="'number'"
                                  [(value)]="items.length"></sd-textfield>
                  </sd-form-item>
                  <sd-form-item [label]="'폭'">
                    <sd-textfield [(value)]="items.specification"></sd-textfield>
                  </sd-form-item>
                  <sd-form-item [label]="'내면'">
                    <sd-textfield [(value)]="items.inside"></sd-textfield>
                  </sd-form-item>
                  <sd-form-item [label]="'외면'">
                    <sd-textfield [(value)]="items.outSide"></sd-textfield>
                  </sd-form-item>
                </sd-form>
              </sd-grid-item>
              <sd-grid-item [width]="'35%'" style="padding-left: 10px; padding-right: 10px;">
                <sd-form>
                  <sd-form-item [label]="'최하'">
                    <sd-textfield [type]="'number'"
                                  [(value)]="items.theMinimum"></sd-textfield>
                  </sd-form-item>

                  <sd-form-item [label]="'최대'">
                    <sd-textfield [type]="'number'"
                                  [(value)]="items.theBest"></sd-textfield>
                  </sd-form-item>
                  <sd-form-item [label]="'평균'">
                    <sd-textfield [type]="'number'"
                                  [(value)]="items.average"></sd-textfield>
                  </sd-form-item>
                </sd-form>
              </sd-grid-item>
              <sd-grid-item [width]="'30%'" style="padding-left: 10px; padding-right: 10px;">
                <sd-form>
                  <sd-form-item [label]="'MD'">
                    <sd-textfield [type]="'number'"
                                  [(value)]="items.md"></sd-textfield>
                  </sd-form-item>
                  <sd-form-item [label]="'TD'">
                    <sd-textfield [type]="'number'"
                                  [(value)]="items.td"></sd-textfield>
                  </sd-form-item>
                  <sd-form-item [label]="'등급'">
                    <sd-select [(value)]="items.rating" [required]="true" (valueChange)="onRatingChange(items)">
                      <sd-select-item [value]="'A'">A</sd-select-item>
                      <sd-select-item [value]="'B'">B</sd-select-item>
                      <sd-select-item [value]="'C'">C</sd-select-item>
                      <sd-select-item [value]="'공통'">공통</sd-select-item>
                    </sd-select>
                  </sd-form-item>
                  <sd-form-item [label]="'정품, 불량'">
                    <sd-select [(value)]="items.defectType" (valueChange)="onRatingChange(items)"
                               [disabled]="items.rating === 'A'">
                      <sd-select-item [value]="defect"
                                      *ngFor="let defect of defectTypeList; trackBy: trackByMeFn">
                        {{ defect }}
                      </sd-select-item>
                    </sd-select>
                  </sd-form-item>
                </sd-form>
              </sd-grid-item>
            </sd-grid>
            <br/>
            <!-- <sd-form>
               <sd-form-item [label]="'비고'" style="padding-left: 20px; padding-right: 20px;">
                 <sd-textfield [(value)]="items.remark"></sd-textfield>
               </sd-form-item>
             </sd-form>-->
          </div>
        </sd-pane>
      </sd-dock-container>
    </sd-busy-container>`
})
export class ProductionItemDetailRegisterModal extends SdModalBase<{ productionItemId: number; goodId: number }, Boolean | undefined> {
  public filter: {
    productionItemId?: number;
  } = {};

  public lastFilter?: {
    productionItemId?: number;
  };

  public items: IGoodsDetailModalVM = {
    id: undefined,
    lotId: undefined,
    specification: undefined, //폭
    weight: undefined, //중량
    length: undefined, //길이
    thickness: undefined, // 두께
    outSide: undefined, // 외면
    inside: undefined, // 내면
    theMinimum: undefined, // 최하
    theBest: undefined, //최상
    average: undefined, // 평균
    md: undefined,
    td: undefined,
    defectType: undefined,
    rating: undefined
  };

  public orgItems?: IGoodsDetailModalVM;

  public goodId: number | undefined;

  public defectTypeList: string[] = [];
  public busyCount = 0;

  public trackByMeFn = (i: number, item: any) => item;

  public trackByIdFn(item: any): number {
    return item.id;
  }

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _cdr: ChangeDetectorRef,
                     private readonly _toast: SdToastProvider) {
    super();
  }

  public async sdOnOpen(param: { productionItemId: number; goodId: number }): Promise<void> {
    this.busyCount--;
    this.defectTypeList = [
      "주름",
      "펑크",
      "알갱이",
      "접힘",
      "젤",
      "칼빠짐",
      "미터부족",
      "기포",
      "두께편차",
      "PE뜯김",
      "라인줄",
      "수축",
      "접착",
      "중량",
      "코로나"
    ].filterExists();

    this.goodId = param.goodId;
    this.filter.productionItemId = param.productionItemId;
    this.lastFilter = Object.clone(this.filter);

    this.busyCount++;

    await this._search();
    this._cdr.markForCheck();
  }

  public async onSaveButtonClick(): Promise<void> {
    await this._save();
    this._cdr.markForCheck();
  }

  public async onRatingChange(item: any): Promise<void> {
    if (item.rating === "A") {
      item.defectType = undefined;
    }
  }

  private async _save(): Promise<void> {
    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        await db.productionItem
          .where(item => [
            sorm.equal(item.id, this.items.id)
          ])
          .updateAsync(
            () => ({
              weight: this.items.weight,
              length: this.items.length,
              thickness: this.items.thickness,
              width: this.items.specification,
              outSide: this.items.outSide,
              inside: this.items.inside,
              theMinimum: this.items.theMinimum,
              theBest: this.items.theBest,
              average: this.items.average,
              md: this.items.md,
              td: this.items.td,
              rating: this.items.rating,
              defectType: this.items.defectType
          }));


        await db.stock
          .include(item => item.lot)
          .where(item => [
            sorm.equal(item.lot!.isNotStock, false),
            sorm.equal(item.lotId, this.items.lotId),
            sorm.equal(item.productionItemId, this.items.id)
            ]
          )
          .updateAsync(() => ({
            rating: this.items.rating
          }));

        const rating = this.items.rating || "공통";
        await StockProc.modifyStock(db, this._appData.authInfo!.companyId, this.goodId!, this.orgItems!.length, this.items!.lotId, 1, "-", rating);
        await StockProc.modifyStock(db, this._appData.authInfo!.companyId, this.goodId!, this.items.length, this.items!.lotId, 1, "+", rating);

        await db.lotHistory
          .where(item => [
            sorm.equal(item.id, this.items.lotId)]
          )
          .updateAsync(() => ({
            goodsRating: this.items.rating,
            weight: this.items.weight,
            length: this.items.length,
            thick: this.items.thickness,
            width: this.items.specification
          }));

      });

      this._toast.success("저장되었습니다.");
      this.close(true);
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

  }

  private async _search(): Promise<void> {

    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        const queryable = this._getSearchQueryable(db);

        const result = await queryable
          .include(item => item.weightMeasurement)
          .include(item => item.inspection)
          .select(item => ({
            id: item.id,
            lotId: item.lotId,
            specification: item.width,
            weight: sorm.ifNull(item.weightMeasurement!.realWeight, item.weight),
            length: item.length,
            thickness: item.thickness,
            rating: sorm.ifNull(item.inspection!.rating, item.rating),
            outSide: item.min,
            inside: item.inside,
            theMinimum: item.theMinimum,
            theBest: item.theBest,
            average: item.average,
            md: item.md,
            td: item.td,
            defectType: item.defectType
          }))
          .resultAsync();

        this.items = {
          id: result[0].id,
          lotId: result[0].lotId,
          specification: result[0].specification,
          weight: result[0].weight,
          length: result[0].length,
          thickness: result[0].thickness,
          rating: result[0].rating,
          outSide: result[0].outSide,
          inside: result[0].inside,
          theMinimum: result[0].theMinimum,
          theBest: result[0].theBest,
          average: result[0].average,
          md: result[0].md,
          td: result[0].td,
          defectType: result[0].defectType
        };

        this.orgItems = Object.clone(this.items);
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

  }

  private _getSearchQueryable(db: MainDbContext): Queryable<ProductionItem> {
    return db.productionItem
      .include(item => item.lot)
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId),
        sorm.equal(item.id, this.lastFilter!.productionItemId)
      ]);
  }

}

export interface IGoodsDetailModalVM {
  id: number | undefined;
  lotId: number | undefined;
  specification: string | undefined; //폭
  weight: number | undefined; //중량
  length: number | undefined; //길이
  thickness: number | undefined; // 두께
  outSide: number | undefined; // 외면
  inside: number | undefined; // 내면
  theMinimum: number | undefined; // 최하
  theBest: number | undefined; //최상
  average: number | undefined; // 평균
  md: number | undefined;
  td: number | undefined;
  defectType: "주름" | "펑크" | "알갱이" | "접힘" | "젤" | "칼빠짐" | "미터부족" | "기포" | "두께편차" | "PE뜯김" | "라인줄" | "수축" | "접착" | "중량" | "코로나" | undefined;
  rating: "A" | "B" | "C" | "공통" | undefined;
}
