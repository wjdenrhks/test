import {ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit} from "@angular/core";
import {DateOnly, DateTime, JsonConvert} from "@simplism/core";
import {GoodReceiptSearchModal} from "../../modals/GoodReceiptSearchModal";
import {SdFileDialogProvider, SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {GoodsReceiptInspection, MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {AppDataProvider} from "@sample/client-common";
import {Queryable} from "@simplism/orm-client";
import {ActivatedRoute} from "@angular/router";
import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-receipt-inspection",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>수입검사</h4>

          <sd-topbar-menu (click)="onAddItemButtonClick()">
            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
            행 추가
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onSaveButtonClick()">
            <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
            저장
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onShowManualButtonClick()" style="float: right; padding-right: 25px;">
            <sd-icon [icon]="'atlas'" [fixedWidth]="true"></sd-icon>
            메뉴얼 보기
          </sd-topbar-menu>
          <!--  <sd-topbar-menu *ngIf="lastFilter && (items && orgItems.length > 0)" (click)="onDownloadButtonClick()">
              <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
              다운로드
            </sd-topbar-menu>-->
        </sd-topbar>

        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'검사일'">
                <sd-textfield [(value)]="filter.fromDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'~'">
                <sd-textfield [(value)]="filter.toDate" [type]="'date'"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'구분'">
                <sd-select [(value)]="filter.type">
                  <sd-select-item [value]="undefined">전체</sd-select-item>
                  <sd-select-item [value]="'합격'">합격</sd-select-item>
                  <sd-select-item [value]="'불합격'">불합격</sd-select-item>
                </sd-select>
              </sd-form-item>
              <br>
              <sd-form-item [label]="'품목명'">
                <app-good-name-select [(value)]="filter.goodName"></app-good-name-select>
              </sd-form-item>
              <sd-form-item [label]="'규격'">
                <app-goods-specification-select [(value)]="filter.specification"
                                                [goodName]="filter.goodName"></app-goods-specification-select>
              </sd-form-item>
              <sd-form-item [label]="'LOT'">
                <sd-textfield [(value)]="filter.lot"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'취소제외'">
                <sd-checkbox [(value)]="filter.isCanceled"></sd-checkbox>
              </sd-form-item>
              <sd-form-item>
                <sd-button [type]="'submit'" [theme]="'primary'">
                  <sd-icon [icon]="'search'" [fixedWidth]="true"></sd-icon>
                  조회
                </sd-button>
              </sd-form-item>
            </sd-form>
          </sd-dock>

          <sd-dock class="sd-padding-sm-default">
            <sd-pagination [page]="pagination.page" [length]="pagination.length"
                           (pageChange)="onPageClick($event)"></sd-pagination>
          </sd-dock>

          <sd-busy-container [busy]="mainBusyCount > 0">
            <sd-dock-container>
              <sd-sheet #sheet [id]="'receipt-inspection'"
                        [items]="items"
                        [trackBy]="trackByIdFn"
                        [(selectedItem)]="selectedItem"
                        (selectedItemChange)="onSelectedItemChanged($event)"
                        [selectable]="true">
                <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <span *ngIf="item.id">{{ item.id }}</span>
                      <a *ngIf="!item.id" (click)="onRemoveItemButtonClick(item)">
                        <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'검사일'" [width]="130">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.testDate" [type]="'date'"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'입고처'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.partnerName }}
                      <a (click)="goodsReceiptSearchModalOpenButtonClick(item)"
                         [attr.sd-invalid]="!item.receiptId">
                        <sd-icon [fixedWidth]="true" [icon]="'search'" *ngIf="!item.id"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'입고일'" [width]="130">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.receiptDate?.toFormatString('yyyy-MM-dd hh:mm') }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'LOT'" [width]="130">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.lotName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'제품'">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.goodName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'규격'" [width]="130">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      {{ item.specification }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'수량'" [width]="130">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.quantity" [type]="'number'" [disabled]="true"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'포장'" [width]="80">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.packing"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'중량'" [width]="80">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.weight" [type]="'number'"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'변형'" [width]="80">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.deformation"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'판정'" [width]="80">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.judgment">
                      <sd-select-item [value]="'합격'">합격</sd-select-item>
                      <sd-select-item [value]="'불합격'">불합격</sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'성적서'" [width]="140">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm">
                      <a class="sd-padding-xs-sm"
                         (click)="onItemGoodsFileUploadButtonClick(item)">
                        파일선택
                      </a>
                      <a *ngIf="item.id && item.isReport" class="sd-padding-xs-sm"
                         (click)="download(item)">
                        다운로드
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등록자'" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.createdByEmployeeName }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등록시간'" [width]="130">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      {{ item.createdAtDateTime?.toFormatString("yyyy-MM-dd HH:mm") }}
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'취소'" [width]="60">
                  <ng-template #item let-item="item">
                    <div style="text-align: center;">
                      <sd-checkbox [(value)]="item.isCanceled"></sd-checkbox>
                    </div>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>

              <sd-dock [position]="'bottom'" style="height: 40%"
                       *ngIf="selectedItem && !!selectedItem.receiptId "
                       [id]="'receipt-inspection-item'">
                <sd-busy-container [busy]="selectedItemBusyCount > 0">
                  <sd-dock-container class="sd-background-default">
                    <sd-dock class="sd-padding-xs-sm">
                      <h5 style="display: inline-block; padding-right: 1.4em;">수입검사 항목</h5>
                    </sd-dock>
                    <sd-pane>
                      <sd-sheet [id]="'receipt-inspection-item'"
                                [items]="selectedItem.inspectionItemList"
                                [trackBy]="trackByIdFn">
                        <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              <span *ngIf="item.createdAtDateTime">1</span>
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <ng-container
                          *ngIf="selectedItem.inspectionTypeList && selectedItem.inspectionTypeList.length > 0">
                          <sd-sheet-column
                            *ngFor="let inspection of selectedItem.inspectionTypeList; let i = index; trackBy: trackByMeFn"
                            [header]="inspection.inspectionTypeName">
                            <ng-template #item let-item1="item">
                              <sd-textfield [(value)]="item1.inspectionInfo[i].inspectionValue"></sd-textfield>
                            </ng-template>
                          </sd-sheet-column>
                        </ng-container>
                        <sd-sheet-column [header]="'검수관'" [width]="100">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.createdByEmployeeName }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                        <sd-sheet-column [header]="'등록시간'" [width]="135">
                          <ng-template #item let-item="item">
                            <div class="sd-padding-xs-sm" style="text-align: center;">
                              {{ item.createdAtDateTime?.toFormatString('yyyy-MM-dd HH:mm:ss') }}
                            </div>
                          </ng-template>
                        </sd-sheet-column>
                      </sd-sheet>
                    </sd-pane>
                  </sd-dock-container>
                </sd-busy-container>
              </sd-dock>
            </sd-dock-container>
          </sd-busy-container>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`
})
export class ReceiptInspectionPage implements OnInit {

  public filter: IFilterVM = {
    id: undefined,
    fromDate: undefined,
    toDate: undefined,
    goodName: undefined,
    specification: undefined,
    lot: undefined,
    type: undefined,
    isCanceled: false
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IReceiptInspectionVM[] = [];
  public orgItems: IReceiptInspectionVM[] = [];

  public selectedItem?: IReceiptInspectionVM;

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public selectedItemBusyCount = 0;

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;


  public constructor(private readonly _cdr: ChangeDetectorRef,
                     private readonly _modal: SdModalProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _orm: SdOrmProvider,
                     private readonly _activatedRoute: ActivatedRoute,
                     private readonly _fileDialog: SdFileDialogProvider,
                     private readonly _appData: AppDataProvider) {
  }

  public async ngOnInit(): Promise<void> {
    this.mainBusyCount++;

    this._activatedRoute.params.subscribe(async params => {
      if (params && params.id) {

        this.lastFilter = Object.clone(this.filter);
        if (params.id) {
          this.filter.id = JsonConvert.parse(params.id);
          this.lastFilter.id = JsonConvert.parse(params.id);
        }
        location.href = location.href.slice(0, location.href.indexOf(";"));
      }
    });


    await this.onSearchFormSubmit();
    this.mainBusyCount--;

    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "수입검사 메뉴얼", {type: "receipt-inspection"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public onAddItemButtonClick(): void {
    this.items.insert(0, {
      id: undefined,
      testDate: new DateOnly(),
      partnerId: undefined,
      partnerName: undefined,
      receiptId: undefined,
      receiptDate: undefined,
      lotId: undefined,
      lotName: undefined,
      goodName: undefined,
      specification: undefined,
      goodId: undefined,
      quantity: undefined,
      packing: undefined,
      weight: undefined,
      deformation: undefined,
      prevJudgment: "합격",
      judgment: "합격",
      isReport: false,
      reportName: undefined,
      reportBuffer: undefined,
      createdAtDateTime: undefined,
      createdByEmployeeId: undefined,
      createdByEmployeeName: undefined,
      isCanceled: false,
      isPrevCanceled: false,
      inspectionItemList: undefined,
      inspectionTypeList: undefined
    });
  }

  public onRemoveItemButtonClick(item: IReceiptInspectionVM): void {
    this.items.remove(item);

    if (this.selectedItem === item) {
      this.selectedItem = undefined;
    }
  }

  public async goodsReceiptSearchModalOpenButtonClick(item: IReceiptInspectionVM): Promise<void> {
    const result = await this._modal.show(GoodReceiptSearchModal, "입고 검색", {isMulti: false, isReceiptInspection: true});
    if (!result) return;

    const goodInspectionInfo = await this._getGoodsInspectionInfo(result.goodId);

    if (!goodInspectionInfo || goodInspectionInfo.length < 1) {
      this._toast.danger("해당 제품의 수입 검사항목이 설정되어 있지 않습니다");
      return;
    }

    item.inspectionTypeList = goodInspectionInfo;

    item.partnerId = result.partnerId;
    item.partnerName = result.partnerName;
    item.receiptId = result.id;
    item.receiptDate = result.dueDate;
    item.lotId = result.lotId;
    item.lotName = result.lotName;
    item.goodName = result.goodName;
    item.specification = result.specification;
    item.goodId = result.goodId;
    item.goodId = result.goodId;
    item.quantity = result.quantity;

    item.inspectionItemList = [];
    item.inspectionItemList!.insert(0, {
      id: 1,
      inspectionInfo: item.inspectionTypeList,
      createdByEmployeeName: item.inspectionTypeList[0].createdByEmployeeName,
      createdAtDateTime: item.inspectionTypeList[0].createdAtDateTime
    });

    this._cdr.markForCheck();
  }

  public async onSelectedItemChanged(item: IReceiptInspectionVM): Promise<void> {
    await this._selectItem(item);
    this._cdr.markForCheck();
  }

  private async _selectItem(selectedItem: IReceiptInspectionVM): Promise<void> {
    if (selectedItem && selectedItem.receiptId) {
      this.selectedItem = selectedItem;

      this.selectedItemBusyCount++;

      const isInspectionType = await this._getGoodsInspectionInfo(this.selectedItem.goodId!);

      if (!isInspectionType || isInspectionType.length < 1) {
        this._toast.danger("해당 제품의 수입 검사항목이 설정되어 있지 않습니다");
        return;
      }

      this.selectedItem!.inspectionTypeList = isInspectionType || [];
      this.selectedItem!.inspectionItemList = this.selectedItem!.inspectionItemList || [];

      if (this.selectedItem!.inspectionItemList!.length < 1) {
        const result = this.selectedItem.id ? await this._getReceiptBuildGoodInfo(this.selectedItem!.receiptId!) : undefined;

        if (result && result.length > 0) {
          for (const productionItem of result) {
            this.selectedItem!.inspectionItemList!.insert(0, {
              id: productionItem.id,
              inspectionInfo: productionItem.inspectionInfo ? productionItem.inspectionInfo : Object.clone(isInspectionType),
              createdByEmployeeName: productionItem.inspectionInfo ? productionItem.inspectionInfo[0].createdByEmployeeName : undefined,
              createdAtDateTime: productionItem.inspectionInfo ? productionItem.inspectionInfo[0].createdAtDateTime : undefined
            });
          }
        }
      }
    }
    this.selectedItemBusyCount--;
    this._cdr.markForCheck();
  }

  public async _getReceiptBuildGoodInfo(receiptId: number): Promise<any[]> {
    let result: any[] = [];
    await this._orm.connectAsync(MainDbContext, async db => {

      result = await db.goodsReceiptInspection
        .where(item => [
          sorm.equal(item.goodsReceiptId, receiptId)
        ])
        .select(item => ({
          id: item.id
        }))
        .orderBy(item => item.id, true)
        .resultAsync();

      for (const listItem of result) {
        listItem.inspectionInfo = [];
        const test: any[] = [];

        if (this.selectedItem!.inspectionTypeList && this.selectedItem!.inspectionTypeList!.length > 0) {
          for (const inspectionItem of this.selectedItem!.inspectionTypeList!) {
            const temp = await db.inspectionItem
              .include(item => item.receiptInspectionItem)
              .include(item => item.inspection)
              .include(item => item.employee)
              .where(item => [
                sorm.equal(item.receiptInspectionItem!.id, listItem.id),
                sorm.equal(item.inspection!.id, inspectionItem.inspectionTypeId)
              ])
              .select(item => ({
                id: item.id,
                inspectionTypeId: item.inspection!.id,
                inspectionTypeName: item.inspection!.name,
                inspectionValue: item.inspectionValue,
                min: item.min,
                avg: item.avg,
                max: item.max,
                standardDeviationMin: item.standardDeviationMin,
                standardDeviationAvg: item.standardDeviationAvg,
                standardDeviationMax: item.standardDeviationMax,
                isUsingChart: item.isUsingChart,
                createdByEmployeeId: item.createdByEmployeeId,
                createdByEmployeeName: item.employee!.name,
                createdAtDateTime: item.createdAtDateTime
              }))
              .singleAsync();

            if (temp) {
              test.push(temp);
            }
            else {
              test.push({
                id: undefined,
                inspectionTypeId: inspectionItem.inspectionTypeId,
                inspectionTypeName: inspectionItem.inspectionTypeName,
                inspectionValue: inspectionItem.inspectionValue,
                min: inspectionItem.min,
                avg: inspectionItem.avg,
                max: inspectionItem.max,
                standardDeviationMin: inspectionItem.standardDeviationMin,
                standardDeviationAvg: inspectionItem.standardDeviationAvg,
                standardDeviationMax: inspectionItem.standardDeviationMax,
                isUsingChart: inspectionItem.isUsingChart,
                createdByEmployeeId: undefined,
                createdByEmployeeName: undefined,
                createdAtDateTime: undefined
              });
            }
          }
          listItem.inspectionInfo = test;
        }
      }
    });

    return result;
  }

  //품질검사 항목 설정되어 있는지 확인
  private async _getGoodsInspectionInfo(goodId: number): Promise<IReceiptInspectionInfoVM[] | undefined> {
    let result: any[] = [];
    await this._orm.connectAsync(MainDbContext, async db => {
      result = await db.goodsInspection
        .include(item => item.inspection)
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.goodsId, goodId)
        ])
        .select(item => ({
          id: item.id,
          inspectionTypeId: item.inspectionId,
          inspectionTypeName: item.inspection!.name,
          inspectionValue: undefined,
          min: item.min,
          avg: item.avg,
          max: item.max,
          standardDeviationMin: item.standardDeviationMin,
          standardDeviationAvg: item.standardDeviationAvg,
          standardDeviationMax: item.standardDeviationMax,
          isUsingChart: item.isUsingChart
        }))
        .resultAsync();
    });

    return result;
  }

  public async onItemGoodsFileUploadButtonClick(item: IReceiptInspectionVM): Promise<void> {
    const file = await this._fileDialog.showAsync();
    if (!file) return;

    this.viewBusyCount++;
    this._cdr.markForCheck();

    try {
      const ext = file.name.split(".").last()!.toLowerCase();

      if (["pdf", "png", "jpg"].includes(ext)) {
        item.reportBuffer = await new Promise<Buffer>(resolve => {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            resolve(Buffer.from(e.target.result));
          };
          reader.readAsArrayBuffer(file);
        });

        item.reportName = file.name;
        this._toast.success("파일이 업로드 되었습니다.");
        this._cdr.markForCheck();
      }
      else {
        throw new Error("지원하지 않는 확장자 입니다.");
      }
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }
    this.viewBusyCount--;
    this._cdr.markForCheck();
  }

  public async download(item: IReceiptInspectionVM): Promise<void> {
    this.mainBusyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        let result: any;

        result = (
          await db.goodsReceiptInspection
            .where(item1 => [
              sorm.equal(item1.id, item.id)
            ])
            .select(item1 => ({
              buffer: item1.isReport
            }))
            .singleAsync()
        )!;

        const blob = new Blob([result.buffer]);
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = item.reportName!;
        link.click();

        this.mainBusyCount--;
        this._cdr.markForCheck();
      });
    }
    catch (err) {
      this.mainBusyCount--;
      throw err;
    }
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.pagination.page = 0;
    this.lastFilter = Object.clone(this.filter);
    await this._search();
    this._cdr.markForCheck();
  }

  public async onPageClick(page: number): Promise<void> {
    this.pagination.page = page;
    await this._search();
    this._cdr.markForCheck();
  }

  @HostListener("document:keydown", ["$event"])
  public async onDocumentKeydown(event: KeyboardEvent): Promise<void> {
    if ((event.key === "s" || event.key === "S") && event.ctrlKey) {
      event.preventDefault();
      await this._save();
      this._cdr.markForCheck();
    }
  }

  public async onSaveButtonClick(): Promise<void> {
    await this._save();
    this._cdr.markForCheck();
  }

  private async _save(): Promise<void> {
    const diffTargets = this.orgItems.diffs(this.items, {keyProps: ["id"]}).map(item => item.target!);

    if (diffTargets.length < 1) {
      this._toast.info("변경사항이 없습니다.");
      if (process.env.NODE_ENV === "test") console.log("변경사항이 없습니다.");
      return;
    }

    if (diffTargets.some(item => !item.receiptId)) {
      this._toast.danger("입고내역은 반드시 선택해야 합니다.");
      return;
    }

    if (diffTargets.some(item => !item.testDate)) {
      this._toast.danger("검사일은 반드시 입력해야 합니다.");
      return;
    }

    this.viewBusyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diffItem of diffTargets) {
          // INSERT
          if (!diffItem.id) {
            const newProductionInstruction = await db.goodsReceiptInspection
              .insertAsync({
                companyId: this._appData.authInfo!.companyId,
                testDate: diffItem.testDate!,
                goodsReceiptId: diffItem.receiptId!,
                goodsId: diffItem.goodId!,
                lotId: diffItem.lotId!,
                quantity: diffItem.quantity!,
                packing: diffItem.packing,
                weight: diffItem.weight,
                deformation: diffItem.deformation,
                judgment: diffItem.judgment,
                isReport: diffItem.reportBuffer,
                reportName: diffItem.reportName,
                isDisabled: diffItem.isCanceled,
                createdByEmployeeId: this._appData.authInfo!.employeeId,
                createdAtDateTime: new DateTime()
              });
            diffItem.id = newProductionInstruction.id;
            diffItem.createdByEmployeeName = this._appData.authInfo!.employeeName;
            diffItem.createdAtDateTime = new DateTime();

            for (const inspectionTypeItem of diffItem.inspectionItemList![0].inspectionInfo || []) {
              const newInspectionItem = await db.inspectionItem
                .insertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  receiptInspectionItemId: diffItem.id,
                  inspectionId: inspectionTypeItem.inspectionTypeId!,
                  goodId: diffItem.goodId!,
                  inspectionValue: inspectionTypeItem.inspectionValue,
                  min: inspectionTypeItem.min,
                  avg: inspectionTypeItem.avg,
                  max: inspectionTypeItem.max,
                  standardDeviationMin: inspectionTypeItem.standardDeviationMin,
                  standardDeviationAvg: inspectionTypeItem.standardDeviationAvg,
                  standardDeviationMax: inspectionTypeItem.standardDeviationMax,
                  isUsingChart: inspectionTypeItem.isUsingChart,
                  createdByEmployeeId: this._appData.authInfo!.employeeId,
                  createdAtDateTime: new DateTime()
                });
              inspectionTypeItem.id = newInspectionItem.id;
            }

            if (diffItem.judgment === "불합격") {
              await db.goodsReceipt
                .where(item => [
                  sorm.equal(item.id, diffItem.receiptId)
                ])
                .updateAsync(
                  () => ({
                    needCanceled: true
                  })
                );
            }

            await db.goodsReceipt
              .where(item => [
                sorm.equal(item.id, diffItem.receiptId)
              ])
              .updateAsync(
                () => ({
                  receiptInspectionId: diffItem.id
                })
              );
          }
          // UPDATE
          else {
            await db.goodsReceiptInspection
              .where(item => [
                sorm.equal(item.id, diffItem.id)
              ])
              .updateAsync(
                () => ({
                  testDate: diffItem.testDate!,
                  packing: diffItem.packing,
                  weight: diffItem.weight,
                  judgment: diffItem.judgment,
                  deformation: diffItem.deformation,
                  isReport: diffItem.reportBuffer,
                  reportName: diffItem.reportName,
                  isDisabled: diffItem.isCanceled
                })
              );

            for (const inspectionTypeItem of diffItem.inspectionItemList![0].inspectionInfo || []) {
              await db.inspectionItem
                .where(item => [
                  sorm.equal(item.receiptInspectionItemId, diffItem.id),
                  sorm.equal(item.inspectionId, inspectionTypeItem.inspectionTypeId)
                ])
                .upsertAsync({
                  companyId: this._appData.authInfo!.companyId,
                  receiptInspectionItemId: diffItem.id,
                  inspectionId: inspectionTypeItem.inspectionTypeId!,
                  goodId: diffItem.goodId!,
                  inspectionValue: inspectionTypeItem.inspectionValue,
                  min: inspectionTypeItem.min,
                  avg: inspectionTypeItem.avg,
                  max: inspectionTypeItem.max,
                  standardDeviationMin: inspectionTypeItem.standardDeviationMin,
                  standardDeviationAvg: inspectionTypeItem.standardDeviationAvg,
                  standardDeviationMax: inspectionTypeItem.standardDeviationMax,
                  isUsingChart: inspectionTypeItem.isUsingChart,
                  createdByEmployeeId: this._appData.authInfo!.employeeId,
                  createdAtDateTime: new DateTime()
                });
            }

            //TODO: 검사 여부에 따라 자동 재고 변하게 하는게 필요할 경우 로직 추가
            if (diffItem.judgment === "불합격" && diffItem.isPrevCanceled && !diffItem.isCanceled) {
              await db.goodsReceipt
                .where(item => [
                  sorm.equal(item.id, diffItem.receiptId)
                ])
                .updateAsync(
                  () => ({
                    needCanceled: true
                  })
                );

              /*  const updateReceipt = await db.goodsReceipt.where(item => [sorm.equal(item.id, diffItem.receiptId!)]).updateAsync(() => ({isDisabled: true}));
                if (updateReceipt) {
                  await StockProc.modifyStock(db, this._appData.authInfo!.companyId, updateReceipt.goodId, updateReceipt.quantity, updateReceipt.receiptLotId, updateReceipt.warehouseId, "-", "공통");
                  await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, updateReceipt.goodId, updateReceipt.quantity, "-");
                }*/
            }
            else if (diffItem.judgment === "불합격" && !diffItem.isPrevCanceled && diffItem.isCanceled) {
              await db.goodsReceipt
                .where(item => [
                  sorm.equal(item.id, diffItem.receiptId)
                ])
                .updateAsync(
                  () => ({
                    needCanceled: false
                  })
                );

              /*    const updateReceipt = await db.goodsReceipt.where(item => [sorm.equal(item.id, diffItem.receiptId!)]).updateAsync(() => ({isDisabled: false}));
                  if (updateReceipt) {
                    await StockProc.modifyStock(db, this._appData.authInfo!.companyId, updateReceipt.goodId, updateReceipt.quantity, updateReceipt.receiptLotId, updateReceipt.warehouseId, "+", "공통");
                    await StockProc.modifyAvailableStock(db, this._appData.authInfo!.companyId, updateReceipt.goodId, updateReceipt.quantity, "+");
                  }*/
            }
            else if (diffItem.judgment !== "불합격") {
              await db.goodsReceipt
                .where(item => [
                  sorm.equal(item.id, diffItem.receiptId)
                ])
                .updateAsync(
                  () => ({
                    needCanceled: false
                  })
                );
            }
          }
        }
      });

      this.orgItems = Object.clone(this.items);
      this._toast.success("저장되었습니다.");
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.viewBusyCount--;
  }

  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        const queryable = this._getSearchQueryable(db);

        this.items = await queryable
          .orderBy(item => item.id)
          .limit(this.pagination.page * 50, 50)
          .wrap(GoodsReceiptInspection)
          .include(item => item.goodsReceipt)
          .include(item => item.goodsReceipt!.partner)
          .include(item => item.goodsReceipt!.receiptLot)
          .include(item => item.goods)
          .include(item => item.employee)
          .include(item => item.inspectionInfo)
          .include(item => item.inspectionInfo![0].employee)
          .include(item => item.inspectionInfo![0].inspection)
          .select(item => ({
            id: item.id,
            testDate: item.testDate,
            partnerId: item.goodsReceipt!.partnerId,
            partnerName: item.goodsReceipt!.partner!.name,
            receiptId: item.goodsReceiptId,
            receiptDate: item.goodsReceipt!.dueDate,
            lotId: item.goodsReceipt!.receiptLotId,
            lotName: item.goodsReceipt!.receiptLot!.lot,
            goodName: item.goods!.name,
            goodId: item.goodsId,
            specification: item.goods!.specification,
            quantity: item.quantity,
            packing: item.packing,
            weight: item.weight,
            deformation: item.deformation,
            prevJudgment: item.judgment,
            judgment: item.judgment,
            isReport: sorm.notNull(item.isReport),
            reportBuffer: undefined,
            reportName: item.reportName,
            createdAtDateTime: item.createdAtDateTime,
            createdByEmployeeId: item.createdByEmployeeId,
            createdByEmployeeName: item.employee!.name,
            isPrevCanceled: item.isDisabled,
            isCanceled: item.isDisabled,

            inspectionItemList: undefined,
            inspectionTypeList: undefined
          }))
          .resultAsync();

        this.orgItems = Object.clone(this.items);
        this.selectedItem = undefined;

        const totalCount = await queryable.countAsync();
        this.pagination.length = Math.ceil(totalCount / 50);
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<GoodsReceiptInspection> {
    let queryable = db.goodsReceiptInspection
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.id) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.id, this.lastFilter!.id)
        ]);
    }

    if (this.lastFilter!.fromDate || this.lastFilter!.toDate) {
      queryable = queryable
        .where(item => [
          sorm.between(item.testDate, this.lastFilter!.fromDate, this.lastFilter!.toDate!)
        ]);
    }

    if (this.lastFilter!.type) {
      queryable = queryable
        .where(item => [
          sorm.equal(item.judgment, this.lastFilter!.type)
        ]);
    }

    if (this.lastFilter!.lot) {
      queryable = queryable
        .include(item => item.lot)
        .where(item => [
          sorm.includes(item.lot!.lot, this.lastFilter!.lot)
        ]);
    }

    if (this.lastFilter!.goodName) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.includes(item.goods!.name, this.lastFilter!.goodName)
        ]);
    }

    if (this.lastFilter!.specification) {
      queryable = queryable
        .include(item => item.goods)
        .where(item => [
          sorm.includes(item.goods!.specification, this.lastFilter!.specification)
        ]);
    }

    if (!!this.lastFilter!.isCanceled) {
      queryable = queryable.where(item => [
        sorm.equal(item.isDisabled, false)
      ]);
    }

    return queryable;
  }
}

interface IFilterVM {
  id?: number;
  fromDate?: DateOnly;
  toDate?: DateOnly;
  goodName?: string;
  specification?: string;
  lot?: string;
  type?: "합격" | "불합격";
  isCanceled: boolean;
}

interface IReceiptInspectionVM {
  id: number | undefined;
  testDate: DateOnly | undefined;
  partnerId: number | undefined;
  partnerName: string | undefined;
  receiptId: number | undefined;
  receiptDate: DateOnly | undefined;
  lotId: number | undefined;
  lotName: string | undefined;
  goodName: string | undefined;
  goodId: number | undefined;
  specification: string | undefined;
  quantity: number | undefined;
  packing: string | undefined;
  weight: string | undefined;
  deformation: string | undefined;
  prevJudgment: "합격" | "불합격" | undefined;
  judgment: "합격" | "불합격" | undefined;
  isReport: boolean | undefined;
  reportBuffer: Buffer | undefined;
  reportName: string | undefined;
  createdAtDateTime: DateTime | undefined;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
  isPrevCanceled: boolean;
  isCanceled: boolean;

  inspectionTypeList: IReceiptInspectionInfoVM[] | undefined;
  inspectionItemList: IRespectInspectionListVM[] | undefined;
}

interface IRespectInspectionListVM {
  id: number | undefined;
  inspectionInfo: IReceiptInspectionInfoVM[] | undefined;
  createdByEmployeeName: string | undefined;
  createdAtDateTime: DateTime | undefined;
}

interface IReceiptInspectionInfoVM {
  id: number | undefined;
  inspectionTypeId: number | undefined;
  inspectionTypeName: string | undefined;
  inspectionValue: string | undefined;
  min: number | undefined;
  avg: number | undefined;
  max: number | undefined;
  standardDeviationMin: number | undefined;
  standardDeviationAvg: number | undefined;
  standardDeviationMax: number | undefined;
  isUsingChart: boolean;
  createdByEmployeeId: number | undefined;
  createdByEmployeeName: string | undefined;
  createdAtDateTime: DateTime | undefined;

}
