export interface IAuthInfo {
  employeeId: number;
  employeeName: string;
  employeeLoginId: string;
  employeeErpSync: string;
  companyId: number;
  companyName: string;

  companyConfig: { [key: string]: any };
  permissions: { [key: string]: any };
}