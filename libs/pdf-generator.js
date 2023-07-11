const { getChecklist } = require("../controller/checklistController")
const { getPointcheck, getRepairData } = require("../controller/repairOrderController")

exports.fonts = {
  Tahoma: {
    normal: "assets/fonts/tahoma/tahoma.ttf",
    bold: "assets/fonts/tahoma/tahoma-bd.ttf",
    italics: "assets/fonts/tahoma/tahoma-it.ttf",
    bolditalics: "assets/fonts/tahoma/tahoma-bfi.ttf",
  },
}

const head = async (SlipNo) => [
  {
    width: "*",
    text: "ใบสั่งซ่อมแม่พิมพ์",
    fontSize: 16,
    alignment: 'center'
  },
  {
    width: "30%",
    margin: [0, 10, 0, 0],
    columns: [
      {
        margin: [0, 4, 0, 0],
        width: "40%",
        text: `SLIP No. DM`,
        bold: true,
        alignment: 'right'
      },
      {
        margin: [10, 0, 0, 0],
        width: "60%",
        text: SlipNo,
        fontSize: 12
      }

    ]
  }
]

const downMold = (Repair, CheckMold) => {
  let { InjDate, PartDate } = Repair
  let body = [{ text: "รายละเอียดการตรวจเช็คก่อน MOLD ลง", style: 'checktitle' }]
  CheckMold.forEach(Mold => {
    let { CheckMoldNo, CheckMold, Checked } = Mold
    body.push({
      stack: [
        { image: Checked == 1 ? 'checked' : 'unchecked', style: 'downmold', width: 7, height: 7 },
        { text: `${CheckMoldNo}) ${CheckMold}`, style: 'downmold', margin: [9, -7, 0, 0] }
      ]
      // text: `${CheckMoldNo}) ${CheckMold}`, style: 'downmold'
    })
  })
  body.push({ text: `กำหนดการ Injection ${InjDate}\nกำหนดการจ่าย PART ${PartDate}`, style: 'tbtext' })
  return body
}

const checkList = async (OrderType, Checklist, Repair) => {
  let Title = OrderType == 4 ? 'รายละเอียดในการตรวจเช็ค' : 'รายละเอียดในการตรวจเช็คและประกอบ'
  let repairlist = [], list1 = [], list2 = [], halfList = Checklist.length / 2;
  let lastTopic = '', indexTopic = 0, indexList = 0
  let ChecklistPreventive, ChecklistRepair;
  if (OrderType == 4) {
    let getCheck = await getChecklist(6)
    ChecklistRepair = getCheck.data
    ChecklistPreventive = Checklist
  } else {
    let getCheck = await getChecklist(7)
    ChecklistRepair = Checklist
    ChecklistPreventive = getCheck.data
    halfList = getCheck.data.length / 2
  }
  // console.log(ChecklistRepair)
  // console.log(ChecklistPreventive)
  ChecklistRepair.forEach(list => {
    let { CheckListNo, CheckList, Checked } = list
    repairlist.push({
      columns: [
        { width: "10%", image: Checked == 1 ? 'checked' : 'unchecked', width: 7, height: 7 },
        {
          width: "*", text: `${CheckListNo}) ${CheckList}`,
          decoration: Checked == 2 ? 'lineThrough' : '',
          margin: [2, 0, 0, 0],
          lineHeight: 1.5
        }
      ]
    })
  })
  ChecklistPreventive.forEach(list => {
    let { CheckTopic, CheckListNo, CheckList, Checked } = list
    indexList++
    if (CheckTopic != lastTopic && CheckTopic != '') {
      lastTopic = CheckTopic
      indexTopic++
      indexTopic <= 5 && indexList <= halfList ?
        list1.push({ text: CheckTopic, style: 'checktitle' }) :
        list2.push({ text: CheckTopic, style: 'checktitle' })
    }
    indexTopic <= 5 && indexList <= halfList ?
      list1.push({
        columns: [
          { width: "10%", image: Checked == 1 ? 'checked' : 'unchecked', width: 7, height: 7 },
          {
            width: "*", text: `${CheckListNo}) ${CheckList}`,
            decoration: Checked == 2 ? 'lineThrough' : '',
            margin: [2, 0, 0, 0],
            lineHeight: 1.5
          }
        ]
      }) :
      list2.push({
        columns: [
          { width: "10%", image: Checked == 1 ? 'checked' : 'unchecked', width: 7, height: 7 },
          {
            width: "*", text: `${CheckListNo}) ${CheckList}`,
            decoration: Checked == 2 ? 'lineThrough' : '',
            margin: [2, 0, 0, 0],
            lineHeight: 1.5
          }
        ]
      })
  })
  let table = {
    headerRows: 1,
    widths: ["40%", "60%"],
    body: [
      [
        {
          columns: [
            { width: "10%", image: OrderType != 4 ? 'checked' : 'unchecked', width: 10, height: 10 },

            {
              width: "*", text: 'Point Check Cleaning / Repair / Corrective',
              fontSize: 8, style: 'btext', margin: [5, 0, 0, 0]
            }
          ]

        }, {
          columns: [
            { width: "10%", image: OrderType == 4 ? 'checked' : 'unchecked', width: 10, height: 10 },
            {
              width: "*", text: 'Point Check Preventive',
              fontSize: 8, style: 'btext', margin: [5, 0, 0, 0]
            }
          ]

        }],
      [{
        stack: [
          { text: Title, style: 'btext' },
          {
            stack: repairlist,
          }
        ]
      }, {
        stack: [
          { text: Title, style: 'btext' },
          {
            columns: [
              { width: "*", stack: list1 },
              { width: "*", stack: list2 }
            ]
          },
          {
            margin: [0, -1, 0, 0], table: await signPart(Repair), style: 'sign'
          },
        ]
      }]
    ]
  }
  return table
}

const mfgPart = async (Repair) => {
  let { Section, SlipNo, RequestUser, RequestTime, InjShot, MoldId, MoldName, PartId, PartName,
    PartNo, McName, Cavity, CoolingType, OrderType, Detail, Cause, CheckMold, InjDate, PartDate, Qa
  } = Repair
  let { TryDate, QaResult, QaRemark, QaUser } = Object.keys(Qa).length !== 0 ? Qa : {
    TryDate: '', QaResult: '', QaRemark: '', QaUser: ''
  }
  return {
    headerRows: 0,
    widths: ["2%", "*"],
    style: 'tbtext',
    body: [
      [
        { image: 'mfg', margin: [0, 80, 0, 0], width: 20 },
        {
          stack: [
            {
              columns: [
                {
                  width: '*', margin: [40, 0, 0, 0], style: 'tbtitle',
                  table: {
                    headerRows: 1,
                    widths: ["20%"],
                    body: [["ISSUED"], [RequestUser]]
                  },
                },
                {
                  width: '20%', margin: [0, 5, 0, 0], alignment: 'left', stack: [
                    { text: `DATE: ${RequestTime}` },
                    { text: `INJECTION SHOT: ${InjShot}` }
                  ]
                }
              ]
            },
            {
              table: {
                headerRows: 0,
                // margin: [0, 0, 0, 0],
                widths: ["19%", "19%", "7%", "10%", "4%", "6%", "7%", "7%", "7%", "7%", "7%"],
                body: [
                  [
                    { text: "Part Name", rowSpan: 2 },
                    { text: "Part No", rowSpan: 2 },
                    { text: "Machine", rowSpan: 2 },
                    { text: "Section", rowSpan: 2 },
                    { text: "Cooling", colSpan: 2 },
                    { text: "" },
                    { text: "Corrective", rowSpan: 2 },
                    { text: "Repair", rowSpan: 2 },
                    { text: "Cleaning", rowSpan: 2 },
                    { text: "Preventive", rowSpan: 2 },
                    { text: "Other", rowSpan: 2 },
                  ],
                  ["", "", "", "", "Oil", "Water", "", "", "", "", ""],
                  [
                    PartName, PartNo, McName, Section,
                    { image: CoolingType.includes('Oil') ? 'tick' : 'blank', width: 15, height: 15 },
                    { image: CoolingType.includes('Water') ? 'tick' : 'blank', width: 15, height: 15 },
                    { image: OrderType == 1 ? 'tick' : 'blank', width: 15, height: 15 },
                    { image: OrderType == 2 ? 'tick' : 'blank', width: 15, height: 15 },
                    { image: OrderType == 3 ? 'tick' : 'blank', width: 15, height: 15 },
                    { image: OrderType == 4 ? 'tick' : 'blank', width: 15, height: 15 },
                    { image: OrderType == 5 ? 'tick' : 'blank', width: 15, height: 15 },
                  ],
                  [
                    { stack: downMold(Repair, CheckMold), rowSpan: 3, colSpan: 2 }, "",
                    { text: "TRY DATE" }, { text: "RESULT", colSpan: 3 }, "", "",
                    { text: "QA CHECK BY", colSpan: 5 }, "", "", "", "",
                  ],
                  [
                    "", "", { text: TryDate },
                    {
                      stack: [
                        { text: "OK", margin: [0, 3, 0, 0] },
                        { image: QaResult == 'OK' ? 'select' : 'blank', width: 25, height: 25, margin: [0, -16, 0, -5] }
                      ]
                    },
                    {
                      stack: [
                        { text: "NG", margin: [0, 3, 0, 0] },
                        { image: QaResult == 'NG' ? 'select' : 'blank', width: 25, height: 25, margin: [0, -16, 0, -5] }
                      ], colSpan: 2
                    }, "",
                    { text: QaUser, colSpan: 5 }, "", "", "", "",
                  ],
                  [
                    "",
                    // { text: `กำหนดการ Injection ${InjDate}\nกำหนดการจ่าย PART ${PartDate}`, colSpan: 2, style: 'tbtext' },
                    "", { text: `Remark: ${QaRemark}`, colSpan: 9, style: 'tbtext' }, "", "", "", "", "", "", "", "",
                  ],
                  [
                    {
                      stack: [
                        {
                          stack: [
                            { text: `รายละเอียดของปัญหา:`, style: 'checktitle' },
                            { text: Detail }
                          ]
                        },
                        {
                          stack: [
                            { text: `สาเหตุการเกิด:`, style: 'checktitle' },
                            { text: Cause }
                          ]
                        },
                      ],
                      colSpan: 11, style: 'tbtext'
                    }, "", "", "", "", "", "", "", "", "", "",
                  ]
                ]
              },
            }
          ]
        }
      ]
    ],
  }
}

const dmPart = async (Repair, PointCheck) => {
  let { OrderType } = Repair
  let { SparePartSlip, FixDetail, CheckStart, CheckEnd,
    CheckDay, CheckHour, CheckMin, Checklist } = PointCheck
  CheckHour = CheckHour - (CheckDay * 24);
  CheckMin = CheckMin - (CheckHour * 60)
  return {
    headerRows: 0,
    widths: ["2%", "*"],
    style: 'tbtext',
    body: [
      [
        { image: 'dm', margin: [-2, 120, 0, 0], width: 15, rowSpan: 2 },
        // { text: "DIE MAKING", rowSpan: 2 },
        {
          stack: [
            {
              columns: [
                { width: '*', text: 'รายละเอียดการแก้ไข', style: 'checktitle' },
                { width: '30%', text: `SLIP No. Spare Part: ${SparePartSlip || '-'}` }
              ]
            },
            // {
            //   text: `${FixDetail || '-'}\n`
            // },
            FixDetail || `__________________________________________________________________________________________________________________________\n`,
            `__________________________________________________________________________________________________________________________\n`,
            `__________________________________________________________________________________________________________________________\n`,
            `__________________________________________________________________________________________________________________________\n`,
            {
              text: `เวลาที่เริ่มตรวจเช็ค.....${CheckStart || '.........................'}.....เวลาที่ตรวจเช็คเสร็จ.....${CheckEnd || '.........................'}.....รวมเวลาตรวจเช็ค..${CheckDay || '..........'}..วัน..${CheckHour || '..........'}..ชั่วโมง..${CheckMin || '..........'}..นาที่`
            }
          ]
        },
      ],
      [
        "", {
          stack: [
            {
              text: 'ใบเตรียมการแม่พิมพ์',
              fontSize: 15,
              style: 'btext'
            },
            {
              table: await checkList(OrderType, Checklist, Repair),
              style: 'smalltext'
            }
          ]
        }
      ],
      // [
      //   "", 
      // ]
    ],
  }
}

const signPart = async (Repair) => {
  // console.log(Repair)
  let { ReceiveUser, ReceiveTime } = Repair
  let { Progress, Check, Approve } = Repair
  let { RepairUser } = Progress
  let { DmCheckUser, DmAltCheckUser, DmCheckTime, DmAltCheckTime } = Check
  let { DmApproveUser, DmAltApproveUser, DmApproveTime, DmAltApproveTime } = Approve
  return {
    headerRows: 0,
    widths: ["*", "*", "*", "*"],
    body: [
      [
        { text: `${ReceiveUser}\n${ReceiveTime}` },
        { text: `${RepairUser || ''}` },
        { text: `${DmCheckUser || DmAltCheckUser || ''}\n${DmCheckTime || DmAltCheckTime || ''}` },
        { text: `${DmApproveUser || DmAltApproveUser || ''}\n${DmApproveTime || DmAltApproveTime || ''}` },
      ],
      ["RECEIVED / Time", "ISSUED", "CHECKED", "APPROVED",]
    ],
  }
}

exports.createRepairDoc = async (RepairId, DocRev = 'F-DM-026 R12', DocRevDate = '01/07/2022') => {
  let Repair = await getRepairData(RepairId)
  let { SlipNo, Progress } = Repair
  let PointCheck = await getPointcheck(RepairId, Progress.IndexProgress)
  let docHead = await head(SlipNo)
  let docMfg = await mfgPart(Repair)
  let docDm = await dmPart(Repair, PointCheck)
  // let docSign = await signPart(Repair)
  // console.log(docHead)
  // console.log(docMfg)
  let doc = {
    info: {
      title: `SLIP No. DM ${SlipNo}`,
      subject: `ใบสั่งซ่อมแม่พิมพ์`,
      creator: "Honda Lock Thai Co.,Ltd.",
    },
    pageMargins: [15, 20, 15, 15],
    pageSize: "A4",
    content: [
      { columns: docHead },
      { table: docMfg, style: 'tbtitle' },
      { text: "\n" },
      { table: docDm },
      { text: `${DocRev} Effective date : ${DocRevDate}`, style: 'smalltext', alignment: 'right' },

    ],
    styles: {
      smalltext: { fontSize: 6 },
      btext: { bold: true },
      bitext: { bold: true, italics: true },
      tbtitle: { fontSize: 6, alignment: "center" },
      tbtext: { alignment: "left" },
      downmold: { fontSize: 6, lineHeight: 1.2, alignment: "left" },

      checktitle: { bold: true, decoration: 'underline', alignment: "left", lineHeight: 1.4 },
      sign: {
        fontSize: 6,
        // decoration: "underline",
        alignment: "center",
        lineHeight: 1.1,
      },
    },
    defaultStyle: {
      font: "Tahoma",
      fontSize: 8,
      lineHeight: 1.1,
      color: "#000000"
    },
    images: {
      unchecked: "data:image/png;base64,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AAEQAAEQAAFoMAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAANRgBAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAHBegDXRxy/RYN25Igp0zVgUff4qDdad66JAF40Z0edDNFh3bogCnTEmRJ+/TYN1544o0AkjLvr8AA3WnUFRoHFjRPT5KA3WnZgo0BGjX/T5SRqsO5OiQPuNPtHnU9vpsN5sT4kC7TNCsnmDUlqsN6WyPENGt6ygihbrTZUsz26jU1bQTIv1plmWZ6fRKivoosV60yXLs9X4VlYQo8V6MyrL84TxpawgGaDHOrNTdhNg7jc+ky0HmhU0WWcqZWmmcwzjsazkHE3WmQuyNBPrJb/KSoZoss7ck6f5i6zk6U66rC+fJ2VpXluv+V5WYtbRZn35ThhmcL3mG2FNP23Wl0FhmCfXa/YJa1aL6LOufCG8pTMPrhf5fxcWnaHRuiKc1jVXdjyvGhBWxWm0rsSFUUZeVP0grDKP02k9OS5N8vyLsq9MJW9AOyLSJI+9KMt5Jq07Sq915Kg0x2Tuy8J70sIwzdaRsDTH11t8f5QWmkfotn4cEcd48VXl1+LKmI9+64YvJo7x9f6+/FVxaQMN140GcYhr+a9rfxPXLhTScb0oXBCHeP9NcZu41uyh5XrRI8+w7U1xibw4zc4grahIyzMs+aNcfv1gzrEmpBFFc/IE397f2yQvN4e30Xdd2DasEGDTWwMUphQGaKfxutCuEF/qnev4sMII6Uo6rweVChcA703n1iqMYD45QO914MATlfRq3xkjsKQyxvReuu88e6dVslt674RPr8og5oPd9N9pdj9Qiq73vWHKlUYxR3NJwFlyR9WSK39/oDG1cQYwwNn8B9RyG/tgpGpT8TeA/wIOslvx79+s/mAo37jiUA+4EnSMvQ8UQxvfYD2/TnEsc5q7QYc4MK2a2UbHu/xTqqM9YUbIESqfqCY25d9ovEbV4cx0O+sCWWdbe1o5sMYNR8yZVR7QHGZtMMsUDaunNZuz8ZhB9SHNOfYHZJWKOQthBT8yaN68hUHTPewSyxqFPWkLUc3nfWzcetMKCw3sFc4KvoYFS0HVf3zoiKWBzRjnBbLAkZi1lD51sq8saW1sM8ypsQxzNGwxomTZp4bvMK0S4exwBjkesRxQxye/IDdh+QvMeOsXJJUJvmiNW08nscnqXY1pA2uD331OXvby+XeDa3ZkU7PZF4VNW0jeu1DJA+VsYmflhXtJe3LZ/GB38bJpF6nRruaqUt4xYoHtpVXNXaMp2yJZLt78O1tMe0lNxgbv3Lh+5WcQcOX6jTuDscmUzWG0bMW6WyZ4lFtb+tkpeESnvMmjgq394zm8Qq+8yMrhrV56nKZZXuT01i8+b9It73FTcPeR95B+eY2HeZL7z0PLdMxbLB+SzUCcomXe4pR0DuosPfMSZ+WzkJfpmne4rDAN7QvRN68QUtqs579L57zBXb/aUlQgSu+8QFT5ba+7xume+xnfpb4cvSdB/9xOYo+VDQn7MMDl/HeftS0pe/gv4Gr+vcewyC6uBF3MyF+tb0sLcDfoWu78xY6NiX5mhFxKj9+wBR+zwq7komEbrAy5j3SrYSOn2B/gMv73d8NWDrFHyFX8x/ZHt+WxT9BF/DMTx/JOs1vcJaz8w8gIhzkx4gom/2ZkiAJOjbmAfxUYmaOFuwHNWW42MkpxmB7rTLjYyDQ1rBBrS6LGyAK5HUlarSPJjmy9vaMsQrf1I1JmZI/6eRquF/P1RlbJC87SdH2YDeYZ2SancYrG68FUY47hBP46NgxqwHid33AKX/UYATjLWLXDz2gv710iBadY6i03nCdQG06RRfZJhWsDGsT/gsKmGIFkl1iTZm9oKWm7v0os2WH1fluJXum/JL/qYpRZ4gyTjF6sytcx/VfkHjsfYedQhliJnD/mhpd17zh4MnhtKJEmMbtIJ4auBU8e3OGC8N8iZ/+J1s7uUF//SHxiZnGNGCWsLc5MxEf6+0Ldna0n9mdwou//JkXuOSrWGJYAAAAASUVORK5CYII=",
      checked: "data:image/png;base64,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",
      tick: "data:image/png;base64,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",
      select: "data:image/png;base64,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",
      mfg: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAzCAIAAAAGi49nAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAAH/SURBVFhH7ZY7UsMwEIZlzpKkYHIC5QShouIIcpmKjhvQyKW5B+IEvgFDgXwX8Uu7Nn6sHwnpwjcZRdpIvx67WiULIajrccffV+Km5M52xaGoqVKdNlTpcrZclmVUEQeeLVcXB6psThVVulw57mS5j1QeUwma4/pFOreIIFfXarvNjVZlVZIly3iDLT5UsiDkBmjjYHfWcruZzxn+AGMd/9ZHkFNaY0DwntuNHDe8jw2tudlH2CyFQtc+sIw7tKy6Fe0el8EkA+JW42HLwI5f0YfbfYTVPcGpSr0WFC1DyL5P5yvAsl189CxWYEbegyWtTHm/2rPA22Zy47T1UEGJOtmckd0KZLmIM9Dsbgl1+AMzcQeJ+Ttbq/pd+a/6+3Oz26vtvdrsOndPQIq7PB52KHkYJTgxu41ZDuOZoB1z608PHRbClJoP/WaL6OBJuRRkxFsqhzkgBE6uXQS54kByC5yq4UAgyMXoXcU13tl5pLNLt2KR9tp0mXTFYvYtpW0JcnmWwZfa2pfTbu66i6ECuREOWSitziDH2ak0LzGd74KjlBcT3WrRGTnCQzQ9HlGUbdMsyGFN8X1IW8dK2TrNZI9GyLKQM8m2gCCHLcWHRsdzw2u9UogQ4y7HtTdGPT5b/Clk64iLM4rM2ozyka/KKMdy3a34Czf19PzLXYpSP8+1oW85VMTcAAAAAElFTkSuQmCC",
      dm: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAABtCAIAAAAqMwZuAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAAP/SURBVFhH7ZlBVtswEIaVniVkweMEzgmgm644grIMG3a9ARtnmZyiG9wT0BPwWCDfxf1HGime8dgJhPbRvnyPZ1uy9FueGY3kMOu6zp3GFz6fwOeQ0Lb4GY/X8Qg2LV8U1nO+2AOJQgiQ877yXCb1Sv0FvrNHSFS+gWhT11zOA2w8/wFfN3wvIyRchec4GkyGOpWRhkCFquJiRthiNpvhOFEzbAAOeKSMfwpIFug1nBsaLIF63EUbLmfEKG49iTxskmc1qf4q2kvAUolAHsGTvLZ6h5o4AhfCpEdAqPNDfFPVAT1xxHWqa7x2B9ASROOh0x8urmFTqHMDydhkb1376MJL+/o8X1y5i0s3X/TiXvAB+UKG1sr2haLbiuEIiVUMvjF2fCbz8VVEvYg9Ckz5u4cfbreDUe/rar5+4hsJSExQY/qTR6vskUHAYAR8HoC2qTM8imlidk4YEmhL4eQo2qlz2KcPEyHx1s4J6dTZCob33n27r918zbUDVIQpieTUAxmi67Z8FRESP1dTcVG43k7FxXsQKQeBNR3hZoOhOfWr9jEbGOaMCcpmd2NkcNMjBzgsgayVikNmNzRdpySWUeJJtuhjNhASrt3QcTwu0QBL/Vw1gEQBE4SvRqDpW+mJIySgOKFCuSPGPpczopzsaKqkpQgzGI24KqMlsdgMVWIGoAGY019LgLSgpUWRluK4lKEumsLAkAC8LKJzVeMcE9+ojWwJEHKAja2DBREXen/3uLq728EQt1/FNk9t+lSAL/lqz694jO+V6TqxjgiJv5S1KMD5kjl2A42esNRy014s4zzqg1FMAE8iyii0yLtkEQowiS0x7AkoOii6dYAJCfOZJQFxowHihupZnvkWiUhd+yBHm+q5MEDcyBs9nGq8Dl4qTYyocJwEWQMd0V1qRYVjJQpKi+iPq8+odmavlXSgxHcyByUKMLGHm44NrUl0aMnJfvrWlZflVBhn2+sChAR2v1gzq7r+vl7YW3ZG3qS32dPA+HEUsFsDFx6Dac4Gxo9erI4RmvAIeTEtTLRrGWdUAs+mRTC+FkbEtRbGvdyZFiHqTFN+6mWEBIab8g2Gn/PFYZOquDhvoE/jLLHnoyWw9uOPC9YHjGqQMKKz1Aw/YFSDxLSE7mBK/DceMWyBxJOKN7IIUo2yhSHRyxfph5N++jj0bXb+4O5LkC3iZ5jN+YO7h9VASmSQVR5b9xLc82t7tZhfXjh8nQ1/hmcgocjLetmzAtpujm0ytETZLsOm9HnZeByLfb215RESDX3YE3FbIGGZCm0UQqLytC0xfyMG/Dnvp398iL9xh97/BPqgPo5DP8AKrV6NwmzwhxPfkHckviH/RuJ7H59Bwrnfs1ClDerRiw4AAAAASUVORK5CYII=",
      blank: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAC4jAAAuIwF4pT92AAAAF0lEQVQYlWP8//8/AzGAiShVowqpphAA1RIDET0/PewAAAAASUVORK5CYIITEDMwMAAAJAYDAbrboo8AAAAASUVORK5CYII="
    },
  };
  return { doc, SlipNo }
}

const tagHead = () => {
  return [
    {
      margin: [0, 10, 0, 0],
      image: 'header',
      width: 260,
      height: 60,
      alignment: 'center'
    },
    {
      margin: [0, -50, 0, 0],
      text: "DIE MAKING DEPARTMENT\nMODIFIED MOLD DESCRIPTION",
      fontSize: 17,
      lineHeight: 1.1,
      alignment: 'center'
    },
    '\n'
  ]
}

const tagDetail = (Repair) => {
  let { SlipNo, ReceiveTime, MoldName,
    Section, Progress, Qa } = Repair
  let { PointCheckTime, FixDetail } = Progress
  let { TryDate, QaResult } = Qa
  console.log(FixDetail)
  let Details = [FixDetail.slice(0, 40),
    '________________________________________________',
    '________________________________________________',
    '________________________________________________',
  ]
  if (FixDetail.length > 40) Details[1] = FixDetail.slice(40, 100)
  if (FixDetail.length > 100) Details[2] = FixDetail.slice(100, 160)
  if (FixDetail.length > 160) Details[3] = FixDetail.slice(160, 220)
  return [
    { text: `MOLD NAME:  ${MoldName || '-'}` },
    { text: `SECTION:  ${Section || '-'}` },
    { text: `SLIP No. DM:  ${SlipNo || '-'}` },
    { text: `DESCRIPTION:  ${Details[0] || '-'}` },
    { text: `${Details[1]}` },
    { text: `${Details[2]}` },
    { text: `${Details[3]}` },
    { text: `ACTION DATE:  ${ReceiveTime || '-'}` },
    { text: `FINISH DATE:  ${PointCheckTime || '-'}` },
    { text: `INJECTION DATE: ${TryDate || '-'}` },
    { text: `RESULT: ${QaResult || '-'}` },
  ]
}

const tagSign = async (Repair) => {
  let { Progress, Check, Approve } = Repair
  let { RepairUser } = Progress
  let { DmCheckUser, DmAltCheckUser } = Check
  let { DmApproveUser, DmAltApproveUser } = Approve
  return {
    headerRows: 0,
    widths: ["15%", "*", "*", "*"],
    // style: 'tb',
    body: [
      [
        { text: 'DEPT.', margin: [0, 10, 0, 0], rowSpan: 2 },
        { text: 'MTN. BY', rowSpan: 1 },
        { text: "CHECK", margin: [0, 10, 0, 0], rowSpan: 2 },
        { text: "APPROVED", margin: [0, 10, 0, 0], rowSpan: 2 },
      ],
      ["", "INJ. BY", "", "",],
      [
        'DM', RepairUser || '-',
        DmCheckUser || DmAltCheckUser || '-',
        DmApproveUser || DmAltApproveUser || '-'
      ],
      [
        'MFG', "", "", ""
      ],
    ],
  }
}

exports.createRepairTag = async (RepairId, TagRev = 'F-DM-032 R02', TagRevDate = '04/01/18') => {
  let Repair = await getRepairData(RepairId)
  let { SlipNo } = Repair
  let doc = {
    info: {
      title: `TAG SLIP No. DM ${SlipNo}`,
      subject: `DIE MAKING DEPARTMENT MODIFIED MOLD DESCRIPTION`,
      creator: "Honda Lock Thai Co.,Ltd.",
    },
    pageMargins: [10, 10, 10, 10],
    pageSize: "A6",
    content: [{
      table: {
        headerRows: 0,
        widths: ["*"],
        body: [
          [
            {
              stack: [
                { stack: tagHead() },
                { stack: tagDetail(Repair) },
                // { text: "\n" },
                { table: await tagSign(Repair), style: 'tbtitle' },
                {
                  columns: [
                    {
                      width: '45%',
                      style: 'sign',
                      text: '*Document storage for 5 years.'
                    },
                    {
                      width: '55%',
                      style: 'sign',
                      alignment: 'right',
                      text: `${TagRev} Effective Date : ${TagRevDate}`,
                    }
                  ]
                },
                { text: "\n" },
              ]
            }
          ],
        ]
      }
    }


    ],
    styles: {
      btext: { bold: true },
      bitext: { bold: true, italics: true },
      tbtitle: { fontSize: 10, alignment: "center", lineHeight: 1.1 },
      tbtext: { alignment: "left" },
      checktitle: { bold: true, decoration: 'underline', lineHeight: 1.4 },
      sign: {
        fontSize: 8,
        // decoration: "underline",
        // alignment: "center",
        lineHeight: 1.2,
      },
    },
    defaultStyle: {
      font: "Tahoma",
      fontSize: 10,
      lineHeight: 1.4,
      color: "#000000"
    },
    images: {
      unchecked: "data:image/png;base64,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AAEQAAEQAAFoMAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAACIAANRgBAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAHBegDXRxy/RYN25Igp0zVgUff4qDdad66JAF40Z0edDNFh3bogCnTEmRJ+/TYN1544o0AkjLvr8AA3WnUFRoHFjRPT5KA3WnZgo0BGjX/T5SRqsO5OiQPuNPtHnU9vpsN5sT4kC7TNCsnmDUlqsN6WyPENGt6ygihbrTZUsz26jU1bQTIv1plmWZ6fRKivoosV60yXLs9X4VlYQo8V6MyrL84TxpawgGaDHOrNTdhNg7jc+ky0HmhU0WWcqZWmmcwzjsazkHE3WmQuyNBPrJb/KSoZoss7ck6f5i6zk6U66rC+fJ2VpXluv+V5WYtbRZn35ThhmcL3mG2FNP23Wl0FhmCfXa/YJa1aL6LOufCG8pTMPrhf5fxcWnaHRuiKc1jVXdjyvGhBWxWm0rsSFUUZeVP0grDKP02k9OS5N8vyLsq9MJW9AOyLSJI+9KMt5Jq07Sq915Kg0x2Tuy8J70sIwzdaRsDTH11t8f5QWmkfotn4cEcd48VXl1+LKmI9+64YvJo7x9f6+/FVxaQMN140GcYhr+a9rfxPXLhTScb0oXBCHeP9NcZu41uyh5XrRI8+w7U1xibw4zc4grahIyzMs+aNcfv1gzrEmpBFFc/IE397f2yQvN4e30Xdd2DasEGDTWwMUphQGaKfxutCuEF/qnev4sMII6Uo6rweVChcA703n1iqMYD45QO914MATlfRq3xkjsKQyxvReuu88e6dVslt674RPr8og5oPd9N9pdj9Qiq73vWHKlUYxR3NJwFlyR9WSK39/oDG1cQYwwNn8B9RyG/tgpGpT8TeA/wIOslvx79+s/mAo37jiUA+4EnSMvQ8UQxvfYD2/TnEsc5q7QYc4MK2a2UbHu/xTqqM9YUbIESqfqCY25d9ovEbV4cx0O+sCWWdbe1o5sMYNR8yZVR7QHGZtMMsUDaunNZuz8ZhB9SHNOfYHZJWKOQthBT8yaN68hUHTPewSyxqFPWkLUc3nfWzcetMKCw3sFc4KvoYFS0HVf3zoiKWBzRjnBbLAkZi1lD51sq8saW1sM8ypsQxzNGwxomTZp4bvMK0S4exwBjkesRxQxye/IDdh+QvMeOsXJJUJvmiNW08nscnqXY1pA2uD331OXvby+XeDa3ZkU7PZF4VNW0jeu1DJA+VsYmflhXtJe3LZ/GB38bJpF6nRruaqUt4xYoHtpVXNXaMp2yJZLt78O1tMe0lNxgbv3Lh+5WcQcOX6jTuDscmUzWG0bMW6WyZ4lFtb+tkpeESnvMmjgq394zm8Qq+8yMrhrV56nKZZXuT01i8+b9It73FTcPeR95B+eY2HeZL7z0PLdMxbLB+SzUCcomXe4pR0DuosPfMSZ+WzkJfpmne4rDAN7QvRN68QUtqs579L57zBXb/aUlQgSu+8QFT5ba+7xume+xnfpb4cvSdB/9xOYo+VDQn7MMDl/HeftS0pe/gv4Gr+vcewyC6uBF3MyF+tb0sLcDfoWu78xY6NiX5mhFxKj9+wBR+zwq7komEbrAy5j3SrYSOn2B/gMv73d8NWDrFHyFX8x/ZHt+WxT9BF/DMTx/JOs1vcJaz8w8gIhzkx4gom/2ZkiAJOjbmAfxUYmaOFuwHNWW42MkpxmB7rTLjYyDQ1rBBrS6LGyAK5HUlarSPJjmy9vaMsQrf1I1JmZI/6eRquF/P1RlbJC87SdH2YDeYZ2SancYrG68FUY47hBP46NgxqwHid33AKX/UYATjLWLXDz2gv710iBadY6i03nCdQG06RRfZJhWsDGsT/gsKmGIFkl1iTZm9oKWm7v0os2WH1fluJXum/JL/qYpRZ4gyTjF6sytcx/VfkHjsfYedQhliJnD/mhpd17zh4MnhtKJEmMbtIJ4auBU8e3OGC8N8iZ/+J1s7uUF//SHxiZnGNGCWsLc5MxEf6+0Ldna0n9mdwou//JkXuOSrWGJYAAAAASUVORK5CYII=",
      checked: "data:image/png;base64,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",
      tick: "data:image/png;base64,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",
      select: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAACAASURBVHic7d17tF1Vfejxb04S8k54CgmSAAEJeYAtggIBlaa1MsR3rBWp7bWlalvpuLVSX4iPO0rb29GrvbXXR19Y+hC1tqhoBVEBUQQFgfCS8BAICAGSkHdyzv3jt7c5OTk52WfvtfZvrb2/nzF+4+yTZGTNOffea/7WXHPNCZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSVItTcgugKTdzAAOAg4GDmz8Pg2YDcxqvJ4JzGm8ng7s3/g5FRho/N3I/3O/Yb9Pavxfw20Adgz7fRuwccS/WQcMApsb8QywqRHrgWcbf76h8fvmxv+xthFPNv6tpAowAZDKNR1YAMwDDiU692YHfxBwyLDXBxGdei/bzK6E4AkiKXhy2J+tBR4DHgUewoRBKo0JgNS+acBc4Giig5877Gfzzw7D71knthDJwGpgTeP1mhF/tgYYyiqgVFeemKSxHUB05s1YAiwGjmHPoXbl2Ao8AqwC7iASg2Y8QNy2kDSCCYAEzwGWAccSHfvCxs9jiPvqqq/NwH3ATxpxH3APcBtxC0LqWyYA6iezgOex6yp+CXASMWSv/vM0u0YNVgE3A7cSkxilnmcCoF40EVgEnNCIpURnfyR+5jW2IeK2we2NuI1ICu7CWwnqMZ4M1QvmEVfyzTiNeIROKsqzRCJw87BYhZMPVWMmAKqbucAL2NXZn0Lcw5e6bR0xStBMCK4F7k8tkTQOJgCqsgFi6P7FwBnA6cDhqSWSxvYIcB2RDHybGCXw1oEqyQRAVdK8d386sAI4i1gcR6qrDcD3gauA64EbiVUWpXQmAMo0hRjCb17hn0Yscyv1qmeJROBa4DtEQrA1tUTqWyYA6rajiav7FcDLiDXupX61mUgIrmrED3FiobrEBEBlmwm8CDgHeCXxKJ6k0T0GfAO4gkgIns4tjnqZCYCKNhF4Pruu8l8MTE4tkVRPO4Fb2DU68G1ge2qJ1FNMAFSEqcBy4ir/DcQGOJKK9RTwFWJ04EpiPoHUNhMAtesA4gr/HODV7Lm/vKTybAauJpKBLwE/yy2O6sgEQONxCPByYCXwK8B+ucWRRNwq+B5wOfAF4OHc4qguTAC0L/OBNwKvA07Gz4xUZUPEo4VfBP4V+GlucVRlnsw1mv2JGfvnEYvxDOQWR1IbBoEbiJGBf8HtjzWCCYCapgK/THT6r8LhfamX7ASuAT5L3CbYmFscVYEJQH8bIFbfO48Y5ndRHqn3bQa+TCQDX8NHC/uWCUB/WgT8DnAucGhyWSTleQz4Z+AzwN3JZVGXmQD0jynEff3zgV/C917S7m4GPkUkBJuSy6IusBPofYuA3wTeChycWxRJNbAO+HfgE8CtyWVRiUwAetNUYoGe84nFeiSpHc1Rgctw4mDPMQHoLccB7yTu7c9JLouk3rGOuDXwceCe5LKoICYAvWE50fG/ltiMR5LKMEQsQfxx4kkCty6uMROA+poC/BrwLmBZclkk9Z97iHkCn8ZJg7VkAlA/hwJvB95BrM0vSZmeAP4e+L+4D0GtmADUxy8Cf0hc9btKX2/bBKxtxJPA08TWr5uBDY3Y3Piz9Y3XG4n7tFvYc7LWemIluKbt7LmV7Exg8rDfJ7LnwlAziAmmcxqvpzX+zczG61mNmNb4swOBg4bF9JZqr7raSjw98FfALcllUQtMAKrvdOB9xC58qqdB4HHi6mgN8BBx1dTs5J8gOvrm75tzilm6acSjqM2E4JARr+cD84DDiZEu96CopyHgSuCjxF4EqigTgOp6KfB+YjMeVdvjwH3Ag8CjxA5sjwx7/Rgutzpek4HDgCOIhGBe4/U8YAGwEFexrIOriETg29kF0Z5MAKpnOfAh7Pir5mlgNbAKuKPxejVwLzHEru6bQiQHRzdiCbC48XoBPhFTJdcDf4ZPDlSKCUA1TCAW7nk/cHJyWfrZNuBOooO/rfHzHuD+xt+pPvYDjiLWxlhCPCmzhFgZ0zk0eb5PjAh8BROBdCYAuSYArwEuAk5MLks/2UkM2Tc7+dsbcS+wI7FcKt8k4HnsSgoWN34uxBGDbroF+DDwJUwE0pgA5HkpcAlwSnZBetwO4qr+JuAHjZ+3EbPlpaapwAnAC4bFYkwKyvY94E9wjkAKE4DuWwJ8EFiZXZAetYZYv/w64r7jj3ANc7VnMpEULAdOasQifDqhDFcB7ya+r1LPOYpYS3snMeRldB4bgP8GPkCMqIx8bl0q2mxigu5FwDeI9RSyvwe9EjuBS4EjW30zpKo7iBjq30z+F6zusY446V5IXJU5mUvZJhKjeucDnyPWdMj+ntQ9tgGfxMc8VWPTiSvT9eR/oeoaa4htSN9GnGS9ZaWqm0B8Vt9OfHbXkP89qmusI56McgVJ1co5xKNj2V+gusVmdl3hn4QdvnrD0cQIwRU4EthOPAz8xrhbXeqy5xFLYGZ/YeoU9xHDfSuJdeSlXjYNWEHcFryJWCY6+ztYl/gmsHT8TS6Vazbwv4l7V9lfkqrHemLDkLcQy7pK/exw4DeJ+QPeLtx3bAP+Ai8WVAETiCvXh8j/YlQ5niBm955DLN8qaU9TiNGBjxF7SWR/b6scjxK3BbxNqBTPB64l/4tQ1VhNnMhWEKuvSWrdADEP5mJi/4ns73NV40ZcTE1dNIPY73oH+R/+qsXNwHuA49tuXUmjWQy8F/gh+d/zqsUO4pw8o+3WlVpwBnA3+R/4KsUDxISmRe03q6RxOJ4YGfBctHusJkYcpULNIYazXcUv4kli5v5yvAcnZVpCJOCPkn9eqEIMEvONDuykUaWms3GS3xDwDLsm8nlPX6qWASIh/xiuRjhEJESv6ahF1dcOJlbyyv4gZ8YgsUnHG3H2vlQXU4E3Ec/N9/s6A/9MnMullq0Efkb+hzcr1hDDigs7bUhJqY4h5gv08yjm47iSoFpwAPB58j+wGbED+Arwahzil3rNZOC1wFfp37lMnyPO8dIezqQ/s+SHgA8CR3TehJJqYD4xKvBT8s8/3Y4Hiae5JCCudi+m/57rv4kYFpvccQtKqqMBYlLvN8g/H3UzdhC3OD339bn5wHfI/0B2K7YRw2CnFdF4knrGScRTPv20n8n3iJ0a1YdeBzxF/oewG/EM8XiQw/ySxnIYMSLaL48SriOemFCfmAn8PfkfvG7E7cDvEFuQSlKrpgO/S//sQ/AZXEq45y2lP5bPvIlYBMNV+iR1YoAYLe2HPQjuIlZWVA86hxjuyf6QlRnXN+ppxy+paCuA75J/niszNgCvL6rBlG8CcCG9/ezrdUTHL0llWw5cQf55r6wYJJ4SmFhUgynHbOA/yf9Aldnxn1VYa0lS604nEoFeXW74Slw4qLaWAveS/yEqI64GTimuqSSpbS8k9h3IPi+WEffgvIDaeSW9eb//dmKfAkmqmhXAzeSfJ4sO5wXUxADwp/TekNRPgF9v1E+SqmoAOBdYTf55s8gYBD6C5+DKmgL8G/kflCLjCWICo1vxSqqTycD5xM6i2efRIuMLuK5K5RxAby3pu4HYoGdmkY0kSV02i1hZ8Fnyz6tFxTXA/gW2kTowD7iF/A9FUXEFsUeBJPWKecReA71ye/YOPE+nW0rvbOF7J/ArxTaPJFXKi4FbyT/fFhGPAs8vtnnUqpcSm9xkfwg6jaeJ+/z7Fds8klRJk4j5AU+Sf/7tNNbjhVvXvQ7YTP6b30kMEkNihxbcNpJUBwcSu5TWfZXWrcRTWuqCP6T+95FuIhbPkKR+90LinJh9Xu4kdgLvLLphtLs/Iv+N7iQ2EzNiJxfcLpJUZ5OAC6j/0wLvLbphFP6Y/De3k7gOWFR4q0hS71hI/ZcVfl/hrdLn3k3+m9pubCQm+bmClCTt2wRikuB68s/f7cYHCm+VPnUh+W9mu3ElPisqSe2YB3yJ/PN4u3FR8U3SXy4m/01sJ54Bziu+OSSp77yF+j7y7UhAmz5E/pvXTtxA3MeSJBVjPvVd7v2SEtqjp9Wx899ODPlMLKE9JKnfTSJGhbeTf74fbzgS0KK3kf9mjTceAJaX0BaSpN2dQmyRnn3eH2/8QRmN0UteBewg/40aT3yO2I1QktQds4mVVLPP/+OJHcQqthrFi6nX8r4bgHNLaQlJUivOo16LB23C0eI9LAWeIv/NaTXuaZRZkpRrEbCK/H6h1XgGOLGUlqih51KvLX2vAPYvpSUkSe2YBXyR/P6h1XgEWFBKS9TIQcCd5L8ZrcQg8TiHK/pJUvVMIBaOq8vugncQOyL2panEM/PZb0IrsRZ4WTnNIEkq0NnU55bydcCUcpqh2v6B/MZvJX4EHFVSG0iSircQ+DH5/Ucr8emS2qCy/oD8Rm8lvk48biJJqpeZwJfJ70daibeV1AaVcxqwlfwG31d8BphcUhtIkso3EfgE+f3JvmIbcGZJbVAZc4FHyW/ssWKQWG5SktQbLqD6kwMfAw4vqwGyTQW+T34jjxVbgDeV1QCSpDSvp/qLzd1Aj04K/Az5jTtWPEUfDMFIUh87DXiC/P5mrPjHsiqf5R3kN+pY8QhwfGm1lyRVxRKqfyv6/NJq32VLqPawy4PAMaXVXpJUNUcBq8nvf/YWW4BlpdW+S6YAt5LfmHuL+4GjS6u9JKmqFlDtbYVvI+bO1dZfkt+Ie4u76OEZl5KkfZpLLMmb3R/tLf6svKqX60yq+9jFHcQbL0nqb4dS3VUDdwJnlVf1chxAdXf4u5nYhEiSJIBDgFvI759Giwep2Q60/0p+o40W9xDZniRJwx1CdXenvbzEehfqzeQ31mjxU9x/WZK0d0cQV9zZ/dVoUflF6g4Dnia/oUbGz4BFJdZbktQbFgNPkt9vjYyniD62si4jv5FGxjrgpDIrLUnqKScD68nvv0bGZ8usdCfOJDbSyW6g4bEZeHGZlZYk9aSXUs1F7Cr3VMB+VG/yxE7gtWVWWpLU01ZSvQvbVUSfWxnvI79RRsb7Sq2xJKkffJD8/mxk/EmpNR6H+cCz5DfI8LgcmFBmpSVJfWEC1Xu0fSOxn0G6/yK/MYbHzcD0UmssSeon04Abye/fhsd/lFrjFryK/EYYHg8D80qtsSSpHz0XWEN+Pzc8XlFqjccwGbi3hQJ2KzYDp5RaY0lSPzsJ2ER+f9eMu4FJpdZ4L36/jcKWGW8tt7qSJPE28vu74fGbpdZ2FDOBxzosdJFRm3WSJUm1V6VJgQ8AU0qt7QgfLrgCncRqYE651ZUk6ecOIDre7P6vGb9Xam2HOYjqLJG4HTit3OpKkrSHU4Bt5PeDQ8CjdOnpt/+VULm9xXtKrqskSXvzfvL7wWa8u+S6ciCxuU52RYeAq4CBcqsrSdJeDQDfJL8/HCJ2MCz1dvhHK1DJIWADsQKhJEmZjqQ6q+FeXFYlZwFPV6CCQ8A7y6qkJEnj9D/J7xeHgKeIp/R6toI3AhPLqKAkSW0YAG4gv38s5QJ5MvBgBSq2HfiFoisnSVKHTqAaTwXcT8GrA55bgUoNEU8gSJJURZeQ308OAW8oslJVGNq4G5haZKUkSSrQNOAn5PeX3ymqQs+vQGWGSNz1SJKkFr2G/P5yiLgl0bFPV6Ai3y6iIpIkdcF15Pebn+i0EnPIf75xEHhhpxWRJKlLTiM/AVhPPL7ftvMrUIl/76QCkiQl+CL5/edvdVKB65MLvw04tpMKSJKU4HnkPxb4rXYLfywx/J5Z+I+3W3hJkpL9Lbl96CCwsJ2Cfzi54FuBee0UXJKkCjiC/FGAD7ZT8DuTC/137RRakqQKuZTcvvSu8Rb4xOQCDwJLxltoSZIqZhn5t9NH7U8H9lLgle3XtRBfBu5ILoMkSZ26Dfh6chnG1adnD/+f2W4tJUmqmLPI7VNbvqBemFzQG1stqCRJNfF9cvvWPZ4GGO0WQPaa+z76J0nqNX+bfPyXt/KP/pu8DGUDMLPTWkqSVDEziD4uq3/96r4KOBPYklhAH/2TJPWqfyKvf91EbFf8cyNvASwHphRX13H7p8RjS5JUpsw+bhqxSdHPjUwAXtq9suzhAeDaxONLklSma4D7E4+/Wx8/MgF4SffKsYfm0IgkSb1oCLgs8fgv2dtfzAa2k3d/4nkFVlKSpCpaRF4/u42YjLiHX04s1N3jbkJJkurpXvL625c0CzH8FsApJVSyVft8PEGSpB7xtcRj/7yvr0oCcGXisSVJ6qbMPu/k0f7wUXKGI54FphZeRUmSqmkasJGcPvfBZiGaIwBzG5HhamLxIUmS+sFm4NtJx54PHAy7EoBR9wruksx7IZIkZci8DbAUdiUAyxIL8t3EY0uSlOGGxGPvlgBkjQBsAVYlHVuSpCw/BrYmHXsZ7EoAFiUV4hZi8SFJkvrJNiIJyHA87EoAFiYV4gdJx5UkKdtNScc9CiIBmA4cmlSIm5OOK0lStqwE4HBg2gBwNDAhqRCOAEiS+lVWAjABOHIAODKpADuAe5KOLUlStjuBnUnHPnIAmJd08IeJJECSpH60nViFN8PcAeCwpIM/uO9/IklST8vqCw8bIG8CoAmAJKnfmQBIktSHHkg67mEDwAFJB38g6biSJFVF1sXw/gPA7KSDP5x0XEmSquKnScedMwDMSTr4+qTjSpJUFRuSjjs7cwRgU9JxJUmqio1Jx50zAExNOrgJgCSp32UlAFMHgMlJB8+qtCRJVZF1MTx5AJiUdHBHACRJ/S7rYnjyBGId4oF9/csS7EcsgyhJUr+aDGxLOO5gRscvSZKSDZC3Ic/0pONKklQVM5KOu90EQJKkPKkJQNZ9+KxKS5JUFVkXw9sHgC1JB3cEQJLU77IuhrcMkLckrwmAJKnfZSUA6waAZ5IOnrUEsSRJVTEr6bjrMkcAjkg6riRJVTE/6bipIwALko4rSVJVpCYAjyUd3ARAktTvjkw67poB4PGkg5sASJL6XVZf+NgAsCbp4EcmHVeSpKo4Mum4qQnA4eTtRChJUrbJwNykYz82ADyYdPBJwKKkY0uSlG0xMDHp2PcPAKuBoaQCvCDpuJIkZTs56bhDwAMDwCbyngQwAZAk9ausPvARGksBA9yXVAgTAElSvzop6birAZoJwF1JhTiRmAQhSVI/mQIsSzr2nbArAbgjqRBTgaVJx5YkKcuJRBKQ4XbYlQDcllQIgNMSjy1JUoYXJR57twQgawQA4FcTjy1JUoaXJx57j4v+R4hHA7odm4BppVRRkqTqmUb0fRl97v3NQjRHAABuLKOWLZgGnJl0bEmSuu0s8i58f97XVyEBgNyhEEmSuimzz/tB80VVEoBzEo8tSVI3Zc59G7WvnwVsJ+eexBBwXNG1lCSpYo4nr5/dCsxoFmT4CMAG4Obi69qyNyUeW5Kkbjg38dg3AhubvwyM+MtvdbUou3sLe5ZHkqReMQCcl3j8bw3/ZWSHe033yrGHBfg0gCSpd50FzE88/ph9/AxgC3n3J/6hqFpKklQxl5LXv7a05s7XEwv4LDCzlVaUJKlGZhJz7bL616+MLNBo99z3+EddNAN4beLxJUkqwxvIvcD9aiv/6GjyMpQhhi1SIElSj/ghuX3rwlYLuiq5oC9ptaCSJFXcCnL71NtHK9TeHrv7fAcVLcIfJx9fkqSivDv5+JeP5x8vIzdbGQJObLOikiRVxQnAILn96eLxFjr7NsA/jrfAkiRVzGXk9qW3tVPoDyUXeitweDsFlySpAuYD28jtSz/QTsGPIn/Y4m/aKbgkSRXwKXL70EHiyb62XJtc+O3EzkmSJNXJceTusDsEfLOTCvx2cuGHyH8iQZKk8fpP8vvPt3RSgdnkLl04RAxhnNpJJSRJ6qLl5Hf+6ylg5cFPVqAiNwATOq2IJEldcD35/eZfF1GREypQkSHgVUVURpKkEr2e/P5yCFhaVIWuq0Bl7qWFrQwlSUoyHbiP/P7yW0VW6o0VqNAQ8KdFVkqSpAL9Ofn95BAxClGYiVQjq9kO/EKRFZMkqQAnkL/ozxCwmuizC3VBBSo2BNxYRuUkSWrTROAm8vvHIeD3yqjgDODJClRuiEhGJEmqgj8iv18cAtYSfXUpPlyBCg4RaxMsKKuSkiS16EjgWfL7xSHgg2VW9EBgXQUqOQRcDQyUWVlJksYwEbiG/P5wiBihn11udeEjFahoM95bcl0lSdqbi8jvB5vxrpLrCsD+wNMJlRsttgOnl1tdSZL2sJz8zX6a8SixBkFXXFxyZcYT9xNJiSRJ3XAg8BD5/V8z3l5udXc3E1hTQiXaDXcMlCR1yxfJ7/eGXwTvV2519/SOAgpeZJxfbnUlSapc3/cb5VZ3dJOAVW0UtqzYDLyo1BpLkvrZacAW8vu7ZtxF9MUpXt1CAbsZjwLPLbXGkqR+NB94jPx+bnicXWqNW3Al+Y0wPH5IiSshSZL6zjTgB+T3b8PjC6XWuEXHU40NEIbH54EJZVZaktQXJgD/Rn6/Njw2EisQVsJfkt8gI+OiUmssSeoHHyK/PxsZF5Za43GaRbWeiRwCBil4T2RJUl/5NaIvye7PhscdwOQyK92Os8lvmJGxFXhZmZWWJPWks6jWjP9mnFVmpTvxefIbZ2RsJB7dkCSpFacQu85m918j49IyK92puVRnn4Dh8QSwuMR6S5J6w1JgLfn91sh4Cji0xHoX4vXkN9Ro8TAVmjUpSaqco4FHyO+vRotfL7HehbqM/MYaLe4FDiux3pKkenoOcDf5/dRo8dkS6124/aneUwHNuAU4uLyqS5Jq5jnAbeT3T6PFA9Rwx9szgB3kN95ocScwr7yqS5Jq4jCq2/nvBF5aXtXL9efkN+De4m7cN0CS+tl84tZwdn+0t/jT8qpevinEkHt2I+4tHgAWllV5SVJlHQncR34/tLf4IbBfWZXvlsXAJvIbc2/xEHBsabWXJFXNccBPye9/9habgWWl1b7Lfpf8Bh0rHsV1AiSpHywF1pDf74wVby2t9kk+RX6jjhVPAS8pq/KSpHSnEwvDZfc3Y8UnSqt9osnAteQ37lixFXhzWQ0gSUrzBmJoPbufGSu+Sw/c99+bw4gV+bIbeawYBC4uqf6SpO67gOrt6jcy1gCHl9UAVXEqcaWd3dj7ir+nglsuSpJaNgn4f+T3J/uKbcDyktqgct5OfoO3Et8A5pTUBpKk8swEvkp+P9JK/E5JbVBZf0d+o7cSt+JaAZJUJ8cCt5Pff7QSnyypDSptCnA9+Y3fSjwFnF1OM0iSCnQO1dyWfrT4Dj086W9f5hBX2NlvQisxCFwCDJTSEpKkTkwALiTWz8/uL1qJ24EDSmmJGjkceJD8N6PV+Aq+aZJUJbOB/yC/f2g1Hib2IRCwBFhL/pvSatxLDy3TKEk1tojY4TW7X2g1ngSOL6UlauwMqr9Iw/DYAJxXSktIklrxFuBZ8vuDVmMjcFopLdEDzgG2k/8mjScux1sCktRNs4F/Jv/8P57YAbymjMboJeeT/0aNNx4kRjAkSeV6EdXexne0GKQHN/gpywfIf8PGG9uJJYQnFd8cktT3JgEfJq6ks8/34433lNAePe1C8t+0duL7wDEltIck9asFVH8zub3FRSW0R1+o40jAEPAMMTlFktS+CcBvAevIP6+3E175d+iPyX8T242vEZmrJGl8FgBfJ/883m68v/gm6U/vIv/NbDc2ErczXEFQkvZtAjEZfD355+92432Ft0qf+yPy39RO4npiwQpJ0ugWAt8k/3zdSTjsX5L/Sf6b20lsJp4UmFxwu0hSnU0CLqBei/qMFn9SdMNod++kPps97C1uAl5YdMNIUg29kDgnZp+XO4mdwO8X3TAa3Wup17LBo8UgcClwaMFtI0l1cBDwMep/QbcFeGPBbaN9OJXYVCH7ze80niYmCfbtntCS+sokYpJfL5y/nwLOLLZ51Kol1Gsr4bHiLuBlxTaPJFXKi4Efk3++LSIeAU4stnk0XvOAH5H/YSgqrsC1AyT1lsOJW56D5J9ji4jbgCMKbSG1bX/gGvI/FEXFs8CHgFlFNpIkddlsYv3+us/uHx5XA3OKbCR1bj/gX8j/cBQZTxLzA6YW2E6SVLbJxH3+x8g/jxYZl+P5uLIGgI/QO8NMzVgNnIurCUqqtgHgPOB+8s+bRcYgsYbLhMJaSqV5BbEhT/aHpui4A1hZYDtJUlFWAD8k/zxZdKwHXlNgO6kLFgN3k//hKSOuwYWEJFXDqcC3yD8vlhF34RLutTUL+A/yP0RlxXXALxXWWpLUuuXEU0vZ58Gy4ivEBHPV2ARiIl3dV5vaVyJwTlENJkljWA5cRf55r6wYBC7BOVc9pVfnBQyPHxFzBJyoIqloK4DvkX+eKzPWE0vNqwctBu4k/0PWjUTg9ZjBSurMAPAG4Bbyz2tlxyrg+GKaTVU1Hfg0+R+2bsSdwNsadZakVs0A3k7vTqQeGZ/E82RfeQ2wlvwPXjdiHbHr1oJCWk5Sr5pLPO/eCxv1tBLP4E5+fesI4Nvkfwi7FTuJWbsrimg8ST3jJGKt/m3kn6e6FTcARxXReKqvicRTAv30wR8CbgJ+g1iyU1L/mUg8PXQd+eejbsZ2YpRjYsctqJ5xOvAA+R/ObsfDxMZDCzpuQUl1cCSxQc/D5J9/uh33A6d13ILqSfsD/07+hzQjdgJXAq/DUQGp1+xHPCL8dXp7Xw923QAACPFJREFUTZSx4l9xFz+14BzgEfI/sFnxFDErdmmnDSkp1fOIRW0eJ/+8khWPEbc7pZYdBHyW/A9vZgwSa3y/GZjWUWtK6pbpRIf3HfLPIdlxKXEul9rycuAh8j/I2bEJ+BwxOuItAqlaJhJL9H6SeOw3+3yRHY8Cr+6oRaWG2cRz9P1672xkrCVONMtx2WEp00nEuekx8s8LVYhB4qr/wE4aVRrNGfTPylitxkPECegXO2hXSa1bTDzGdi/53/8qxWpc40Qlmw78FbCD/A981eIW4APAsrZbV9JoTgQuAn5M/ve8arGDOCe7lK+65vk4yWasuJ8YGViBcwak8RogbrFdAtxF/ve5qnEjcEqbbSx17BycJLiveJK4L7cSmNleM0s9byqRMH8MWEP+97bK8SjxpINzkJRuFvAX9N9ywu3Es8DngbcSezFI/Ww+8NvAF4CN5H8/qx5bgT8nzrlSpRwLfJX8L0md4j7iiYKVxNMWUi+bRlzlX0LsxzFI/newLnE1sGT8TS511znEjNTsL0zdYjuxMcmFxONNDu+pFxwNXAB8A9hM/vesbvFTXMlPNTMNeC+x33T2F6iusQb4F+AdxLLEA+N6B6TuGyCegvk9Yu15n89vP54G3oOrkKrGDiSG+8z8O4/1xFXUxcQw6pTW3wapFJOI0aoLiJUynyT/e1L32ErcFnzOON4HqdIWAP+EqwkWGRuBbxLbGf8KsZujVKYDgJcRn7lrcOJekbED+AdiYqS6wHus3Xc8cfJYmV2QHrUGuHlYXE/sbiiN10xivY+ThsXxeN4sw1XAu4BbswvST/wg5zmTuDVwanZBetwgsZDKTY34AbGa2qbMQqlyphOr7b0AOLnx8zicd1K27xKTfq/LLkg/MgHI9ypiiU/X0u+eQWKlwtuAOxo/VxH7PGxLLJfKtx+wiFhPfxnxWNlS4Cjs7LvpJuAjwH9lF6SfmQBUwwTgbOB9OCKQaTtwD3smBfcBWxLLpfGbChxDXMUvJjr5pcRaHS5Nnee7wEeBK7MLIhOAKlpODIm9Irsg2s3TxNoOzVhFJAo/IfZfV/dNBeYRV/GLieftm3EkXtFXyfXAnwFXZBdEu5gAVNcZwPuJ2e2qtieIUYIHiUmIDzV+Pgw8QqxbvjWtdPU0hejcDweeC8wlZofPa/xcCBySVjq16mvEFf/12QXRnkwAqu8UIhF4Bb5fdfY4uycFjwNrG/HksFhL7JfQi2YCBxEd98GN1804lF2d/Tx8BrzOhoh7+x8l7vWrouxQ6mMZ8IfAubgATq/byq5koBmbiMWknhn2eh3xHPomYEMjdjT+fHDY/7eZ3ecw7CQWVRpuNjBx2O9T2X0FtgFgDnH/fGbj308DZjT+fBoxk37/Ya+bnXuzs/dz29u2AJcB/we4PbksaoEJQP08B/gt4A+IKyZJyvQzYgGfjxO3u1QTJgD1tR/xCOG7iNsEktRNtwKfAD5LjDKpZkwAesNy4J3Aa9l9GFeSijRILL/9ceDLxP1+1ZQJQG85lrg1cB6uiy+pOM8AlwJ/TTz6qh5gAtCbpgCvBM4HfgnfZ0ntuRn4FDG5b2NyWVQwO4bedxwxafB/4HPTkvbtGWJr478h9s1QjzIB6B+OCkgaS/Nq30l9fcJOoD8dC/w28GZi0RVJ/ekRosP/O7y333dMAPrbAHAasBJ4E7Fgi6Teto5Yqe9yYlOeHbnFURYTADVNIfYdWAm8jljJTVJv2Ap8g+j0P0+sHqk+ZwKg0cwhFhlaCfwqMCm3OJLaMAjcQHT6lxHLS0s/ZwKgfTkc+DViVOBFuMWqVGXNTv+LwL/h0rwagwmAxuNg4GxiZOCXcXMXqQp2At8jrvQvx05fLTIBULumE48TriQeL5yTWxypr2wiluS9HPhPYmKfNC4mACrCFGAF8GoiGXAvd6l4jxOz978EXE1M7JPaZgKgMiwBXkEkBWcSOxdKGp+dwC3AVcTGO98l7vFLhTABUNlmAKcSycArgeNziyNV2v3E43pXNX4+k1sc9TITAHXb0UQysAJ4GTA7tzhSqk3Elf1Vjbg5tzjqJyYAyjQFOJm4TXAGcDowK7VEUrk2ANc14jvAjcC21BKpb5kAqEomAouIRGAF8BLcwVD1tp7o5K8CrscOXxViAqAqm0DMGWiOECwH5qeWSBrbg8TV/bWNuBMYSi2RtBcmAKqb/YGlxCjBcuIWwqGpJVK/ega4g+jwm1f3j6eWSBoHEwD1gnnAScPiVOCg1BKp12wAfkxM0mvGKry6V42ZAKgXDQDHASc0YgkxanAU7mWgsQ0Sj+LdRlzd3wbcCtyDz+Crx5gAqJ/sBxxLjBIsJhKDxURi4Heh/zxNXMXfTHT2q4iFd57NLJTULZ70JDgQWEYkB8eMiBmJ5VLnNgI/GRH3ALcDTyWWS0pnAiCN7QBi8aLh0byl4AZI1bAFWE1cxa8eEQ/g0L00KhMAqX3TgLnEJMS5RHIw8vWhOO+gE1uI7W1XA2tGed38KWmcTACkck0DnkskBXOBg4knFA4a9vqQYa97/ZbDRmAt8CTwROPn2mF/tpbo1NcADwObc4op9T4TAKlaprF7gjANmE6sfzC98fscYGbj9axGTGdX8jCD3XdgnNL4+6YB9rx9sY7dh8o3sft2s9uIzpvGz03Eo3EbGq83Nv6PzY3fnx72eu2wsEOXJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJHXi/wNYBa9OEa/Q9wAAAABJRU5ErkJggg==",
      mfg: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAzCAIAAAAGi49nAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAAH/SURBVFhH7ZY7UsMwEIZlzpKkYHIC5QShouIIcpmKjhvQyKW5B+IEvgFDgXwX8Uu7Nn6sHwnpwjcZRdpIvx67WiULIajrccffV+Km5M52xaGoqVKdNlTpcrZclmVUEQeeLVcXB6psThVVulw57mS5j1QeUwma4/pFOreIIFfXarvNjVZlVZIly3iDLT5UsiDkBmjjYHfWcruZzxn+AGMd/9ZHkFNaY0DwntuNHDe8jw2tudlH2CyFQtc+sIw7tKy6Fe0el8EkA+JW42HLwI5f0YfbfYTVPcGpSr0WFC1DyL5P5yvAsl189CxWYEbegyWtTHm/2rPA22Zy47T1UEGJOtmckd0KZLmIM9Dsbgl1+AMzcQeJ+Ttbq/pd+a/6+3Oz26vtvdrsOndPQIq7PB52KHkYJTgxu41ZDuOZoB1z608PHRbClJoP/WaL6OBJuRRkxFsqhzkgBE6uXQS54kByC5yq4UAgyMXoXcU13tl5pLNLt2KR9tp0mXTFYvYtpW0JcnmWwZfa2pfTbu66i6ECuREOWSitziDH2ak0LzGd74KjlBcT3WrRGTnCQzQ9HlGUbdMsyGFN8X1IW8dK2TrNZI9GyLKQM8m2gCCHLcWHRsdzw2u9UogQ4y7HtTdGPT5b/Clk64iLM4rM2ozyka/KKMdy3a34Czf19PzLXYpSP8+1oW85VMTcAAAAAElFTkSuQmCC",
      dm: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAABtCAIAAAAqMwZuAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAAP/SURBVFhH7ZlBVtswEIaVniVkweMEzgmgm644grIMG3a9ARtnmZyiG9wT0BPwWCDfxf1HGime8dgJhPbRvnyPZ1uy9FueGY3kMOu6zp3GFz6fwOeQ0Lb4GY/X8Qg2LV8U1nO+2AOJQgiQ877yXCb1Sv0FvrNHSFS+gWhT11zOA2w8/wFfN3wvIyRchec4GkyGOpWRhkCFquJiRthiNpvhOFEzbAAOeKSMfwpIFug1nBsaLIF63EUbLmfEKG49iTxskmc1qf4q2kvAUolAHsGTvLZ6h5o4AhfCpEdAqPNDfFPVAT1xxHWqa7x2B9ASROOh0x8urmFTqHMDydhkb1376MJL+/o8X1y5i0s3X/TiXvAB+UKG1sr2haLbiuEIiVUMvjF2fCbz8VVEvYg9Ckz5u4cfbreDUe/rar5+4hsJSExQY/qTR6vskUHAYAR8HoC2qTM8imlidk4YEmhL4eQo2qlz2KcPEyHx1s4J6dTZCob33n27r918zbUDVIQpieTUAxmi67Z8FRESP1dTcVG43k7FxXsQKQeBNR3hZoOhOfWr9jEbGOaMCcpmd2NkcNMjBzgsgayVikNmNzRdpySWUeJJtuhjNhASrt3QcTwu0QBL/Vw1gEQBE4SvRqDpW+mJIySgOKFCuSPGPpczopzsaKqkpQgzGI24KqMlsdgMVWIGoAGY019LgLSgpUWRluK4lKEumsLAkAC8LKJzVeMcE9+ojWwJEHKAja2DBREXen/3uLq728EQt1/FNk9t+lSAL/lqz694jO+V6TqxjgiJv5S1KMD5kjl2A42esNRy014s4zzqg1FMAE8iyii0yLtkEQowiS0x7AkoOii6dYAJCfOZJQFxowHihupZnvkWiUhd+yBHm+q5MEDcyBs9nGq8Dl4qTYyocJwEWQMd0V1qRYVjJQpKi+iPq8+odmavlXSgxHcyByUKMLGHm44NrUl0aMnJfvrWlZflVBhn2+sChAR2v1gzq7r+vl7YW3ZG3qS32dPA+HEUsFsDFx6Dac4Gxo9erI4RmvAIeTEtTLRrGWdUAs+mRTC+FkbEtRbGvdyZFiHqTFN+6mWEBIab8g2Gn/PFYZOquDhvoE/jLLHnoyWw9uOPC9YHjGqQMKKz1Aw/YFSDxLSE7mBK/DceMWyBxJOKN7IIUo2yhSHRyxfph5N++jj0bXb+4O5LkC3iZ5jN+YO7h9VASmSQVR5b9xLc82t7tZhfXjh8nQ1/hmcgocjLetmzAtpujm0ytETZLsOm9HnZeByLfb215RESDX3YE3FbIGGZCm0UQqLytC0xfyMG/Dnvp398iL9xh97/BPqgPo5DP8AKrV6NwmzwhxPfkHckviH/RuJ7H59Bwrnfs1ClDerRiw4AAAAASUVORK5CYII=",
      blank: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAC4jAAAuIwF4pT92AAAAF0lEQVQYlWP8//8/AzGAiShVowqpphAA1RIDET0/PewAAAAASUVORK5CYIITEDMwMAAAJAYDAbrboo8AAAAASUVORK5CYII=",
      header: "data:image/png;base64,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"
    },
  };
  return { doc, SlipNo }
}