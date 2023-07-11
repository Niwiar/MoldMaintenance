const sql = require("mssql");
const dbconfig = require("../libs/dbconfig");
const createError = require("http-errors");
const { encrypt } = require("../libs/utils");
const { getStatus } = require("./repairOrderController");

exports.signin = async (Userpass, RepairId, Time, Action = 'repair', SubAction = 'PASS', Index = 0, Reason = '') => {
  let pool = await sql.connect(dbconfig);
  let HashPass = encrypt(Userpass);
  let login = await pool.request().query(`SELECT a.UserId, a.PositionId, b.Section, a.Username,
      a.MgAltCheckOrder,a.MgAltApproveOrder,a.MgQaOrder
    FROM [User] a
    LEFT JOIN [MasterSection] b on a.SectionId = b.SectionId
    WHERE Userpass = N'${HashPass}' AND a.Active = 1`);
  if (!login.recordset.length) {
    let user = await pool.request().query(`SELECT Active FROM [User]
      WHERE Userpass = N'${HashPass}'`);
    if (user.recordset.length) {
      throw Error('User is not Activate')
    } else {
      throw Error('User is not Found')
    }
  }
  let { UserId, PositionId, Section, Username, MgAltCheckOrder, MgAltApproveOrder, MgQaOrder } = login.recordset[0];
  let auth = await pool.request().query(`SELECT * FROM [MasterPosition]
    WHERE PositionId = ${PositionId}`);
  if (Action == 'repair') { // Sign in Repair
    let CheckLogin = `Select UserId FROM [RepairTech]
      WHERE RepairId = ${RepairId} AND UserId = ${UserId} AND LogoutTime IS NULL`
    let DupLogin = await pool.request().query(CheckLogin)
    if (DupLogin.recordset.length) throw Error('Already sign-in to repair order')
    let Login = `UPDATE [RepairTech] SET LogoutTime = N'${Time}'
        WHERE UserId = ${UserId} AND LogoutTime IS NULL;
      INSERT [RepairTech](RepairId, UserId, LoginTime)
        VALUES(${RepairId}, ${UserId}, N'${Time}');`
    await pool.request().query(Login)
    return `${Username} log-in to repair order`

  } else if (Action == 'check') { // Sign in Check
    let DupCheck = await pool.request().query(`SELECT CheckUserId, AltCheckUserId, DmCheckUserId, DmAltCheckUserId
        FROM [RepairCheck] WHERE RepairId = ${RepairId} AND IndexCheck = ${Index}`)
    let { DmCheckUserId, DmAltCheckUserId } = DupCheck.recordset[0]
    if (DmCheckUserId) throw Error('Repair order has already DM. Checked')
    let { MgCheckOrder } = auth.recordset[0]
    if (!(MgAltCheckOrder || MgCheckOrder)) throw Error('No permission to check repair order')
    if (MgCheckOrder) {
      let SignCheck = `UPDATE [RepairCheck]
          SET DmCheckResult = N'${SubAction}',DmCheckTime = N'${Time}',
            DmCheckUserId = ${UserId},DmCheckReason = N'${Reason}'
          WHERE RepairId = ${RepairId} AND IndexCheck = ${Index}`
      await pool.request().query(SignCheck)
      return `${Username} has check repair order`
    } else if (MgAltCheckOrder) {
      if (DmAltCheckUserId) throw Error('Repair order has already alternate DM. Checked')
      let SignCheck = `UPDATE [RepairCheck]
          SET DmAltCheckResult = N'${SubAction}',DmAltCheckTime = N'${Time}',
            DmAltCheckUserId = ${UserId},DmAltCheckReason = N'${Reason}'
          WHERE RepairId = ${RepairId} AND IndexCheck = ${Index}`
      await pool.request().query(SignCheck)
      return `${Username} has alternate check repair order`
    }
  } else if (Action == 'approve') {// Sign in Approve
    let DupApprove = await pool.request().query(`SELECT ApproveUserId, AltApproveUserId, DmApproveUserId, DmAltApproveUserId
      FROM [RepairApprove] WHERE RepairId = ${RepairId} AND IndexApprove = ${Index}`)
    let { DmApproveUserId, DmAltApproveUserId } = DupApprove.recordset[0]
    if (DmApproveUserId) throw Error('Repair order has already DM. Approved')
    let { MgApproveOrder } = auth.recordset[0]
    if (!(MgAltApproveOrder || MgApproveOrder)) throw Error('No permission to approve repair order')
    if (MgApproveOrder) {
      let StatusId = await getStatus(RepairId)
      let checkCheck = await pool.request().query(`SELECT TOP 1 DmCheckUserId
        FROM RepairCheck WHERE RepairId = ${RepairId} ORDER BY IndexCheck DESC`)
      if (StatusId == 7 && !checkCheck.recordset[0].DmCheckUserId) throw Error('Please check repair order before approve')
      let SignApprove = `UPDATE [RepairApprove]
          SET DmApproveResult = N'${SubAction}',DmApproveTime = N'${Time}',
          DmApproveUserId = ${UserId},DmApproveReason = N'${Reason}'
          WHERE RepairId = ${RepairId} AND IndexApprove = ${Index}`
      await pool.request().query(SignApprove)
      return `${Username} has approve repair order`
    } else if (MgAltApproveOrder) {
      if (DmAltApproveUserId) throw Error('Repair order has already alternate DM. Approved')
      let SignApprove = `UPDATE [RepairApprove]
          SET DmAltApproveResult = N'${SubAction}',DmAltApproveTime = N'${Time}',
          DmAltApproveUserId = ${UserId},DmAltApproveReason = N'${Reason}'
          WHERE RepairId = ${RepairId} AND IndexApprove = ${Index}`
      await pool.request().query(SignApprove)
      return `${Username} has alternate approve repair order`
    }
  } else if (Action == 'qacheck') { // Sign in Qa
    let DupQa = await pool.request().query(`SELECT QaUserId
      FROM [RepairQa] WHERE RepairId = ${RepairId} AND IndexQa = ${Index}`)
    if (DupQa.recordset[0].QaUserId) throw Error('Repair order has already qa check')
    // let { QaOrder } = auth.recordset[0]
    if (!MgQaOrder) throw Error('No permission to qa check repair order')
    let SignQa = `UPDATE [RepairQa]
        SET QaResult = N'${SubAction}',QaTime = N'${Time}', QaUserId = ${UserId}
        WHERE RepairId = ${RepairId} AND IndexQa = ${Index}`
    await pool.request().query(SignQa)
    return `${Username} has qa check repair order`
  } else if (Action == 'qareject') { // Sign in Qa
    let DupQa = await pool.request().query(`SELECT QaUserId,QaResult,QaRemark,
        FORMAT(TryDate,'yyyy-MM-dd HH:mm:ss') TryDate
      FROM [RepairQa] WHERE RepairId = ${RepairId} AND IndexQa = ${Index}`)
    if (!DupQa.recordset[0].QaUserId) throw Error('Repair order QA is not checked')
    let { QaResult, QaRemark, TryDate } = DupQa.recordset[0]
    // let { QaOrder } = auth.recordset[0]
    let { MgCheckOrder, MgApproveOrder } = auth.recordset[0]
    if (!(MgAltCheckOrder || MgCheckOrder || MgAltApproveOrder || MgApproveOrder))
      throw Error('No permission to approve repair order')
    let RejectQa = `UPDATE [RepairQa]
        SET QaResult = N'${QaResult}', QaRemark = N'${QaRemark}', TryDate = N'${TryDate}',
        CheckQaResult = N'${SubAction}',CheckQaTime = N'${Time}',
        CheckQaUserId = ${UserId} ,CheckQaReason = N'${Reason}'
      WHERE RepairId = ${RepairId} AND IndexQa = ${Index + 1}`
    await pool.request().query(RejectQa)
    return `${Username} has reject qa check`
  }
}

exports.signout = async (UserId, RepairId, Time) => {
  let pool = await sql.connect(dbconfig);
  await pool.request().query(`UPDATE [RepairTech]
    SET LogoutTime = N'${Time}'
    WHERE RepairId = ${RepairId} AND UserId = ${UserId} AND LogoutTime IS NULL`)
  return `Log-out from repair order`
}