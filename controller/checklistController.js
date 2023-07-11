const sql = require("mssql");
const dbconfig = require("../libs/dbconfig");
const createError = require("http-errors");

const isCheckDup = async (Data, Action) => {
  let { CheckType, CheckNo, Check } = Data
  let pool = await sql.connect(dbconfig);
  let CheckDup = ''
  if (Action == 'add') {
    if (CheckType == 1) {
      // Check Mold
      CheckDup = `SELECT CASE
      WHEN EXISTS(
        SELECT *
        FROM MasterCheckMold
        WHERE CheckMold = N'${Check}' OR CheckMoldNo = '${CheckNo}'
      )
      THEN CAST (1 AS BIT)
      ELSE CAST (0 AS BIT) END AS 'check'`
    } else if (CheckType == 2) {
      // Check Repair
      CheckDup = `SELECT CASE
      WHEN EXISTS(
        SELECT *
        FROM MasterCheckRepair
        WHERE CheckRepair = N'${Check}' OR CheckRepairNo = '${CheckNo}'
      )
      THEN CAST (1 AS BIT)
      ELSE CAST (0 AS BIT) END AS 'check'`
    } else if (CheckType == 3) {
      // Check Preventive
      let { TopicId } = Data
      CheckDup = `SELECT CASE
      WHEN EXISTS(
        SELECT *
        FROM MasterCheckPreventList
        WHERE CheckPreventTopicId = ${TopicId}
          AND (CheckPreventListNo = '${CheckNo}' OR CheckPreventList = N'${Check}')
      )
      THEN CAST (1 AS BIT)
      ELSE CAST (0 AS BIT) END AS 'check'`
    }
  } else if (Action == 'edit') {
    let { CheckId } = Data
    if (CheckType == 1) {
      // Check Mold
      CheckDup = `SELECT CASE
      WHEN EXISTS(
        SELECT *
        FROM MasterCheckMold
        WHERE NOT CheckMoldId = ${CheckId}
          AND (CheckMold = N'${Check}' OR CheckMoldNo = '${CheckNo}')
      )
      THEN CAST (1 AS BIT)
      ELSE CAST (0 AS BIT) END AS 'check'`
    } else if (CheckType == 2) {
      // Check Repair
      CheckDup = `SELECT CASE
      WHEN EXISTS(
        SELECT *
        FROM MasterCheckRepair
        WHERE NOT CheckRepairId = ${CheckId}
          AND (CheckRepair = N'${Check}' OR CheckRepairNo = '${CheckNo}')
      )
      THEN CAST (1 AS BIT)
      ELSE CAST (0 AS BIT) END AS 'check'`
    } else if (CheckType == 3) {
      // Check Preventive
      let { TopicId } = Data
      CheckDup = `SELECT CASE
      WHEN EXISTS(
        SELECT *
        FROM MasterCheckPreventList
        WHERE NOT CheckPreventListId = ${CheckId} AND CheckPreventTopicId = ${TopicId}
          AND (CheckPreventListNo = '${CheckNo}' OR CheckPreventList = N'${Check}')
      )
      THEN CAST (1 AS BIT)
      ELSE CAST (0 AS BIT) END AS 'check'`
    }
  }
  let isDup = await pool.request().query(CheckDup)
  return isDup.recordset[0].check
}
const isTopicDup = async (Data, Action) => {
  let { TopicId, Topic } = Data
  let pool = await sql.connect(dbconfig);
  let TopicDup = '';
  if (Action == 'add') {
    TopicDup = `SELECT CASE
    WHEN EXISTS(
      SELECT *
      FROM MasterCheckPreventTopic
      WHERE CheckPreventTopic = N'${Topic}'
    )
    THEN CAST (1 AS BIT)
    ELSE CAST (0 AS BIT) END AS 'check'`
  } else if (Action == 'edit') {
    TopicDup = `SELECT CASE
    WHEN EXISTS(
      SELECT *
      FROM MasterCheckPreventTopic
      WHERE NOT CheckPreventTopicId = ${TopicId}
        AND CheckPreventTopic = N'${Topic}'
    )
    THEN CAST (1 AS BIT)
    ELSE CAST (0 AS BIT) END AS 'check'`
  }
  let isDup = await pool.request().query(TopicDup)
  return isDup.recordset[0].check
}

const CHECKTYPE = ['Mold Down', 'Repair', 'Preventive List', 'Preventive Topic']

const getChecklist = async (CheckType, TopicId = 0) => {
  try {
    let pool = await sql.connect(dbconfig);
    let SelectCheck = ''
    if (CheckType == 1) {
      // Check Mold
      SelectCheck = `SELECT CheckMoldId, CheckMoldNo, CheckMold
        FROM [MasterCheckMold] ORDER BY CheckMoldNo
        `;
    } else if (CheckType == 2) {
      // Check Repair
      SelectCheck = `SELECT CheckRepairId, CheckRepairNo, CheckRepair
        FROM [MasterCheckRepair] ORDER BY CheckRepairNo`;
    } else if (CheckType == 3) {
      // Check Preventive List
      SelectCheck = `SELECT CheckPreventListId, CheckPreventListNo, CheckPreventList
        FROM [MasterCheckPreventList] WHERE CheckPreventTopicId = ${TopicId} ORDER BY CheckPreventListNo`;
    } else if (CheckType == 4) {
      // Check Preventive Topic
      SelectCheck = `SELECT row_number() over(order by CheckPreventTopicId) as 'index',
          CheckPreventTopicId, CheckPreventTopic
        FROM [MasterCheckPreventTopic]
        ORDER BY CheckPreventTopicId`;
    } else if (CheckType == 5) {
      // Check Preventive Topic And List
      SelectCheck = `SELECT a.CheckPreventListId, a.CheckPreventListNo, a.CheckPreventList,
          a.CheckPreventTopicId, b.CheckPreventTopic
        FROM [MasterCheckPreventList] a
        LEFT JOIN [MasterCheckPreventTopic] b on a.CheckPreventTopicId = b.CheckPreventTopicId
        ORDER BY a.CheckPreventTopicId, a.CheckPreventListNo`;
    } else if (CheckType == 6) {
      // Check Repair for Doc
      SelectCheck = `SELECT CheckRepairNo CheckListNo, CheckRepair CheckList, 0 Checked
        FROM [MasterCheckRepair] ORDER BY CheckRepairNo`;
    } else if (CheckType == 7) {
      // Check Preventive for Doc
      SelectCheck = `SELECT a.CheckPreventListNo CheckListNo,
          a.CheckPreventList CheckList, b.CheckPreventTopic CheckTopic, 0 Checked
        FROM [MasterCheckPreventList] a
        LEFT JOIN [MasterCheckPreventTopic] b on a.CheckPreventTopicId = b.CheckPreventTopicId
        ORDER BY a.CheckPreventTopicId, a.CheckPreventListNo`;
    } else return { msg: 'Wrong Type' }
    let Check = await pool.request().query(SelectCheck);
    return { msg: 'OK', data: Check.recordset }
  } catch (err) {
    return { msg: `${err}` }
  }

}

const addChecklist = async (Data) => {
  try {
    let { CheckType, CheckNo, Check } = Data
    if (await isCheckDup(Data, 'add'))
      return { msg: `Duplicate Check ${CHECKTYPE[CheckType - 1]}` }
    let pool = await sql.connect(dbconfig);
    let InsertCheck = ''
    if (CheckType == 1) {
      InsertCheck = `INSERT INTO MasterCheckMold(CheckMoldNo, CheckMold)
        VALUES('${CheckNo}',N'${Check}')`; // Check Mold
    } else if (CheckType == 2) {
      InsertCheck = `INSERT INTO MasterCheckRepair(CheckRepairNo, CheckRepair)
        VALUES('${CheckNo}',N'${Check}')`; // Check Repair
    } else if (CheckType == 3) {
      let { TopicId } = Data
      InsertCheck = `INSERT INTO MasterCheckPreventList(
          CheckPreventTopicId,CheckPreventListNo,CheckPreventList
        )
        VALUES(${TopicId},'${CheckNo}',N'${Check}')`; // Check Preventive List
    } else return { msg: 'Wrong Type' }
    await pool.request().query(InsertCheck);
    return { msg: 'OK' }
  } catch (err) {
    return { msg: `${err}` }
  }
}

const editChecklist = async (Data) => {
  try {
    let { CheckType, CheckId, CheckNo, Check } = Data
    if (await isCheckDup(Data, 'edit'))
      return { msg: `Duplicate Check ${CHECKTYPE[CheckType - 1]}` }
    let pool = await sql.connect(dbconfig);
    let UpdateCheck = ''
    if (CheckType == 1) {
      UpdateCheck = `UPDATE MasterCheckMold
        SET CheckMoldNo = '${CheckNo}', CheckMold = N'${Check}'
        WHERE CheckMoldId = ${CheckId}`; // Check Mold
    } else if (CheckType == 2) {
      UpdateCheck = `UPDATE MasterCheckRepair
        SET CheckRepairNo = '${CheckNo}', CheckRepair = N'${Check}'
        WHERE CheckRepairId = ${CheckId}`; // Check Repair
    } else if (CheckType == 3) {
      let { TopicId } = Data
      UpdateCheck = `UPDATE MasterCheckPreventList
        SET CheckPreventTopicId = ${TopicId},
          CheckPreventListNo = '${CheckNo}', CheckPreventList = N'${Check}'
        WHERE CheckPreventListId = ${CheckId}`; // Check Preventive List
    } else return { msg: 'Wrong Type' }
    await pool.request().query(UpdateCheck);
    return { msg: 'OK' }
  } catch (err) {
    return { msg: `${err}` }
  }
}

const deleteChecklist = async (Data) => {
  try {
    let { CheckType, CheckId } = Data
    let pool = await sql.connect(dbconfig);
    let DeleteCheck = ''
    if (CheckType == 1) {
      DeleteCheck = `DELETE FROM MasterCheckMold
        WHERE CheckMoldId = ${CheckId}`; // Check Mold
    } else if (CheckType == 2) {
      DeleteCheck = `DELETE FROM MasterCheckRepair
        WHERE CheckRepairId = ${CheckId}`; // Check Repair
    } else if (CheckType == 3) {
      DeleteCheck = `DELETE FROM MasterCheckPreventList
        WHERE CheckPreventListId = ${CheckId}`; // Check Preventive List
    } else if (CheckType == 4) {
      DeleteCheck = `DELETE FROM MasterCheckPreventList
          WHERE CheckPreventTopicId = ${CheckId};
        DELETE FROM MasterCheckPreventTopic
          WHERE CheckPreventTopicId = ${CheckId};`; // Check Preventive Topic
    } else return { msg: 'Wrong Type' }
    await pool.request().query(DeleteCheck);
    return { msg: 'OK' }
  } catch (err) {
    return { msg: `${err}` }
  }
}

const addTopic = async (Data) => {
  try {
    let { Topic } = Data
    if (await isTopicDup(Data, 'add'))
      return { msg: `Duplicate Check Preventive Topic` }
    let pool = await sql.connect(dbconfig);
    InsertTopic = `INSERT INTO MasterCheckPreventTopic(
      CheckPreventTopic
    )
    VALUES(N'${Topic}')`; // Check Preventive Topic
    await pool.request().query(InsertTopic);
    return { msg: 'OK' }
  } catch (err) {
    return { msg: `${err}` }
  }
}
const editTopic = async (Data) => {
  try {
    let { TopicId, Topic } = Data
    if (await isTopicDup(Data, 'edit'))
      return { msg: `Duplicate Check Preventive Topic` }
    let pool = await sql.connect(dbconfig);
    UpdateTopic = `UPDATE MasterCheckPreventTopic
    SET CheckPreventTopic = N'${Topic}'
    WHERE CheckPreventTopicId = ${TopicId}`; // Check Preventive Topic
    await pool.request().query(UpdateTopic);
    return { msg: 'OK' }
  } catch (err) {
    return { msg: `${err}` }
  }
}

module.exports = {
  getChecklist, addChecklist, editChecklist, deleteChecklist,
  addTopic, editTopic
}