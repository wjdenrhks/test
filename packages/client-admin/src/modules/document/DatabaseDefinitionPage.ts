import {ChangeDetectionStrategy, Component, OnInit} from "@angular/core";
import {SdOrmProvider} from "@simplism/angular";
import {MainDbContext} from "@sample/main-database";
import {ormHelpers} from "@simplism/orm-query";
import {ExcelWorkbook} from "@simplism/excel";

@Component({
  selector: "app-database-definition",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-topbar-container>
      <sd-topbar>
        <h4>데이타베이스 명세</h4>
        <sd-topbar-menu (click)="onExcelDownloadButtonClick()">
          <sd-icon [icon]="'file-excel'" [fixedWidth]="true"></sd-icon>
          엑셀 다운로드
        </sd-topbar-menu>
      </sd-topbar>


      <sd-dock-container>
        <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
          <sd-form [inline]="true">
            <sd-form-item [label]="'검색어'">
              <sd-textfield [(value)]="filter.name"></sd-textfield>
            </sd-form-item>
          </sd-form>
        </sd-dock>

        <sd-pane class="sd-background-white sd-padding-lg">
          <div *ngFor="let table of getFilteredTables(); trackBy: trackByNameFn">
            <br/>
            <h3>
              {{ table.name }}
              <small>
                ( {{ table.database }}.{{ table.scheme || "dbo" }} )
              </small>
            </h3>
            <p>{{ table.description }}</p>
            <table>
              <thead>
              <tr>
                <th>구분</th>
                <th>명칭</th>
                <th>데이타타입</th>
                <th>AUTO</th>
                <th>NULL</th>
                <th>FK/FKT 컬럼</th>
                <th>설명</th>
              </tr>
              </thead>
              <tbody>
              <tr *ngFor="let col of table.columns; trackBy: trackByNameFn"
                  [class.sd-background-primary-lightest]="col.type === 'PK'"
                  [class.sd-background-info-lightest]="col.type === 'FK'"
                  [class.sd-background-success-lightest]="col.type === 'FKT'">
                <td style="text-align: center;">{{ col.type }}</td>
                <td>{{ col.name }}</td>
                <td>
                  <ng-container *ngIf="col.type !== 'FK' && col.type !== 'FKT'">
                    {{ col.dataType }}
                  </ng-container>
                  <ng-container *ngIf="col.type === 'FK' || col.type === 'FKT'">
                    <a (click)="filter.name = col.dataType">
                      {{ col.dataType }}
                    </a>
                    <ng-container *ngIf="col.type === 'FKT'">[]</ng-container>
                  </ng-container>
                </td>
                <td style="text-align: center;">
                  <sd-icon *ngIf="col.autoIncrement" [fixedWidth]="true" [icon]="'check'"></sd-icon>
                </td>
                <td style="text-align: center;">
                  <sd-icon *ngIf="col.nullable" [fixedWidth]="true" [icon]="'check'"></sd-icon>
                </td>
                <td>{{ col.targetColumnNames.join(", ") }}</td>
                <td>
                  <pre>{{ col.description }}</pre>
                </td>
              </tr>
              </tbody>
            </table>
            <br/>
          </div>
        </sd-pane>
      </sd-dock-container>
    </sd-topbar-container>`
})
export class DatabaseDefinitionPage implements OnInit {
  public filter: { name?: string } = {};
  public tables: ITableDefVM[] = [];

  public trackByNameFn = (i: number, item: any) => item.id || item;

  public constructor(private readonly _orm: SdOrmProvider) {
  }

  public async ngOnInit(): Promise<void> {
    const tableDefs = this._orm.getTableDefinitions(MainDbContext);
    this.tables = tableDefs.map(tableDef => ({
      database: tableDef.database || (process.env.DB_CONNECTION as any).database,
      scheme: tableDef.scheme || "dbo",
      name: tableDef.name,
      description: tableDef.description || "",
      columns: tableDef.columns!
        .map<IColumnDefVM>(colDef => ({
          type: colDef.primaryKey ? "PK" : "",
          name: colDef.name,
          dataType: colDef.dataType || ormHelpers.getDataTypeFromType(colDef.typeFwd()),
          autoIncrement: !!colDef.autoIncrement,
          nullable: !!colDef.nullable,
          targetColumnNames: [],
          description: colDef.description || ""
        }))
        .concat(tableDef.foreignKeys
          ? tableDef.foreignKeys.map(fkDef => ({
            type: "FK",
            name: fkDef.name,
            dataType: fkDef.targetTypeFwd().name,
            autoIncrement: false,
            nullable: false,
            targetColumnNames: fkDef.columnNames,
            description: fkDef.description || ""
          }))
          : []).concat(tableDef.foreignKeyTargets
          ? tableDef.foreignKeyTargets.map(fktDef => ({
            type: "FKT",
            name: fktDef.name,
            dataType: fktDef.sourceTypeFwd().name,
            autoIncrement: false,
            nullable: false,
            targetColumnNames: [fktDef.foreignKeyName],
            description: fktDef.description || ""
          }))
          : [])
    }));
  }

  public getFilteredTables(): ITableDefVM[] {
    return (
      this.filter.name
        ? this.tables.filter(item => Object.values(item).some(item1 => typeof item1 === "string" && (item1.toLowerCase()).includes((this.filter.name || "").toLowerCase())))
        : this.tables
    ).orderBy(item => item.name);
  }


  public async onExcelDownloadButtonClick(): Promise<void> {
    const defaultStyle = {
      borderWidth: "thin",
      borderColor: "FF000000"
    };

    const headerStyle = {
      ...defaultStyle,
      alignH: "center",
      background: "FF673AB7",
      foreground: "FFFFFFFF",
      bold: true
    };

    const wb = ExcelWorkbook.create();
    for (const table of this.tables) {
      const ws = wb.createWorksheet(`${table.name}`);
      ws.cell(0, 0).merge(0, 6);
      ws.cell(0, 0).value = `${table.name} (${table.database}.${table.scheme})`;
      for (let i = 0; i <= 6; i++) {
        Object.assign(ws.cell(0, i).style, headerStyle);
      }

      ws.cell(1, 0).value = "설명";
      Object.assign(ws.cell(1, 0).style, headerStyle);

      ws.cell(1, 1).merge(1, 6);
      ws.cell(1, 1).value = table.description;
      for (let i = 1; i <= 6; i++) {
        Object.assign(ws.cell(1, i).style, defaultStyle);
      }

      ws.cell(2, 0).value = "구분";
      ws.cell(2, 1).value = "명칭";
      ws.cell(2, 2).value = "데이터타입";
      ws.cell(2, 3).value = "AUTO";
      ws.cell(2, 4).value = "NULL";
      ws.cell(2, 5).value = "FK/FKT 컬럼";
      ws.cell(2, 6).value = "설명";
      for (let i = 0; i <= 6; i++) {
        Object.assign(ws.cell(2, i).style, headerStyle);
      }

      for (let i = 0; i < table.columns.length; i++) {
        const column = table.columns[i];
        ws.cell(i + 3, 0).value = column.type;
        ws.cell(i + 3, 1).value = column.name;
        ws.cell(i + 3, 2).value = column.dataType;
        ws.cell(i + 3, 3).value = column.autoIncrement ? "Y" : undefined;
        ws.cell(i + 3, 4).value = column.nullable ? "Y" : undefined;
        ws.cell(i + 3, 5).value = column.targetColumnNames.join(", ");
        ws.cell(i + 3, 6).value = column.description;

        for (let j = 0; j <= 6; j++) {
          Object.assign(ws.cell(i + 3, j).style, defaultStyle);

          if (column.type === "PK") {
            ws.cell(i + 3, j).style.background = "FFEDE7F6";
          }
          else if (column.type === "FK") {
            ws.cell(i + 3, j).style.background = "FFE3F2FD";
          }
          else if (column.type === "FKT") {
            ws.cell(i + 3, j).style.background = "FFE8F5E9";
          }
        }
        ws.cell(i + 3, 0).style.alignH = "center";
        ws.cell(i + 3, 3).style.alignH = "center";
        ws.cell(i + 3, 4).style.alignH = "center";
      }

      ws.column(0).width = 5;
      ws.column(1).width = 25;
      ws.column(2).width = 25;
      ws.column(3).width = 7;
      ws.column(4).width = 7;
      ws.column(5).width = 25;
      ws.column(6).width = 40;
    }

    await wb.downloadAsync("DatabaseDefinition.xlsx");
  }
}

interface ITableDefVM {
  database: string;
  name: string;
  scheme: string;

  description: string;
  columns: IColumnDefVM[];
}

interface IColumnDefVM {
  type: string;
  name: string;
  dataType: string;
  autoIncrement: boolean;
  nullable: boolean;
  targetColumnNames: string[];
  description: string;
}
