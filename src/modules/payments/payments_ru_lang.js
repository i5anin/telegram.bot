// messages.js

function getColorEmoji(color) {
    switch (color) {
        case 'green':
            return '🟢'
        case 'red':
            return '🔴'
        case 'blue':
            return '🔵'
        case 'white':
            return '⚪️'
        default:
            return '' // Возвращает пустую строку, если цвет не соответствует ни одному из заданных
    }
}

const operatorTypeMapping = { f: 'Фрезер', t: 'Токарь' }

const moment = require('moment')
const { formatNumber } = require('#src/modules/sk_operator/helpers')

module.exports = {
    payments: (paymentData) =>
        `<b>${getColorEmoji(paymentData.color)} ${paymentData.fio} (${paymentData.grade_info || ''})</b>\n` +
        `<b>${paymentData.post || ''}</b>\n` +
        `Дата: <b>${moment(paymentData.date, 'YYYY-MM-DD').format('DD.MM.YYYY')}</b> \n` +
        '<blockquote>' +
        `Отработанные часы:  <b>${formatNumber(paymentData.work_hours)}</b>\n` +
        `Грейд: <b>${paymentData.grade.toFixed(2)}</b>\n` +
        `Сумма долей для расчёта : <b>${paymentData.part_sum.toFixed(2)}</b> \n` +
        `Доля от прибыли: <b>${paymentData.part.toFixed(2)}</b>\n` +
        `ВП:\u00A0\u00A0<b>${formatNumber(paymentData.vvp)}</b>\u00A0₽\n` +
        `Доля команды:\u00A0\u00A0<b>${formatNumber(paymentData.vvp * 0.2)}</b>\u00A0₽\n` +
        `Потенциальный рост дохода:\u00A0\u00A0<b>${paymentData.payments_diff}</b>\u00A0%\n` +
        '</blockquote>' +
        `📈 Ваша чистая прибыль на сегодня: <b>${formatNumber(paymentData.payment * (1 - 0.13))}</b>\u00A0₽\n` +
        '<tg-spoiler><b>Формула:</b>\n' +
        'ЗП = ВП / Сумма долей * Доля от прибыли\n' +
        'Доля от прибыли = Грейд * отработанные часы / 168</tg-spoiler>',

    paymentsOperator: (paymentData) =>
        `<b>${getColorEmoji(paymentData.color)} ${paymentData.fio} (${paymentData.grade_info || ''})</b>\n` +
        `<b>${paymentData.post || ''} (${operatorTypeMapping[paymentData.operator_type] || ''})</b>\n` +
        `Дата: <b>${moment(paymentData.date, 'YYYY-MM-DD').format('DD.MM.YYYY')}</b> \n` +
        '<blockquote>' +
        `Рейтинг ЦКП:  <b>${paymentData.rating_good}\u00A0/\u00A0${paymentData.group_count}\u00A0/\u00A0${paymentData.kpi_good}</b>\n` +
        `Рейтинг Качества:  <b>${paymentData.rating_brak}\u00A0/\u00A0${paymentData.group_count}\u00A0/\u00A0${paymentData.kpi_brak}</b>\n` +
        `Смена:\u00A0\u00A0<b>${paymentData.smena}</b>\u00A0` +
        `ЦКП:\u00A0\u00A0<b>${formatNumber(paymentData.kpi)}</b>\u00A0` +
        `Рейтинг:\u00A0\u00A0<b>${paymentData.rating_pos}</b>\u00A0\n` +
        `Отработанные часы:  <b>${formatNumber(paymentData.work_hours)}</b>\n` +
        `Грейд: <b>${paymentData.grade.toFixed(2)}</b>\n` +
        `Сумма долей для расчёта : <b>${paymentData.part_sum.toFixed(2)}</b> \n` +
        `Доля от прибыли: <b>${paymentData.part.toFixed(2)}</b>\n` +
        `ВП:\u00A0\u00A0<b>${formatNumber(paymentData.vvp)}</b>\u00A0₽\n` +
        `Доля команды:\u00A0\u00A0<b>${formatNumber(paymentData.vvp * 0.2)}</b>\u00A0₽\n` +
        `Потенциальный рост дохода:\u00A0\u00A0<b>${paymentData.payments_diff.toFixed(2)}</b>\u00A0%\n` +
        `Отклонение от цели участка ЧПУ:\u00A0\u00A0<b>${paymentData.prod_diff.toFixed(2)}</b>\u00A0%\n` +
        '</blockquote>' +
        `📈 Ваша чистая прибыль на сегодня: <b>${formatNumber(paymentData.payment * (1 - 0.13))}</b>\u00A0₽\n` +
        '<tg-spoiler><b>Формула:</b>\n' +
        'ЗП\u00A0= ВП\u00A0/\u00A0Сумма долей\u00A0*\u00A0Доля\u00A0от\u00A0прибыли\n' +
        'Доля\u00A0от\u00A0прибыли = Грейд\u00A0*\u00A0Отработанные\u00A0часы\u00A0/\u00A0168</tg-spoiler>',
}