// const moment = require('moment')
const { checkUser } = require('#src/api/index')
const { fetchMetrics, getUsersToSend, getMetricsMaster } = require('#src/api/index')
const { sendToLog } = require('#src/utils/log')
const { formatMetricsMessage, formatMetricsMessageFrez, formatMetricsMessageToc } = require('#src/utils/ru_lang')
const { formatNumber, getUserLinkById } = require('#src/utils/helpers')
const { message } = require('telegraf/filters')


function getMaxCharacters(latestMetrics) {
    const percentageValues = [latestMetrics.prod, latestMetrics.cumulative_brak_month, latestMetrics.cumulative_manager_month, latestMetrics.sles, latestMetrics.otk, latestMetrics.upk]
    let maxCharacters = 0
    for (let value of percentageValues) {
        let characters = formatNumber(value).length + 1  // +1 для знака процента
        if (characters > maxCharacters) {
            maxCharacters = characters
        }
    }
    return maxCharacters
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function metricsNotification(ctx = null, index = 0) {
    try {
        const metrics = await fetchMetrics()
        if (metrics.length === 0 || !metrics[index]) {
            throw new Error('No metrics data available')
        }

        const latestMetrics = metrics[index]
        const maxCharacters = getMaxCharacters(latestMetrics)
        const message = formatMetricsMessage(latestMetrics, maxCharacters)
        if (index === 1) {
            await sendToLog(ctx)
            const chatId = ctx.chat.id  // Получите chatId из контекста
            const userCheck = await checkUser(chatId)  // Проверьте пользователя

            if (!userCheck.exists || (userCheck.role !== 'admin' && userCheck.role !== 'dir')) {
                console.error(`User ${chatId} does not have the necessary permissions.`)
                return  // Если у пользователя нет необходимых прав, просто возвращаемся из функции
            }
            await ctx.reply(message, { parse_mode: 'HTML' })
            await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Запрос метрики <code>${ctx.from.id}</code>\n` + message, { parse_mode: 'HTML' })
        } else {
            const ADMIN_IDS = [DIR_METRIC, DIR_OPLATA, DIR_TEST_GROUP] //1164924330 - Лера
            for (const adminId of ADMIN_IDS) {
                try {
                    await bot.telegram.sendMessage(adminId, message, { parse_mode: 'HTML' })
                    console.log('Metrics Message sent successfully to adminId:', adminId)
                } catch (error) {
                    console.error('Failed to send message to adminId:', adminId, 'Error:', error)
                    await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Не удалось отправить сообщение <code>${adminId}</code>\n<code>${error}</code>`, { parse_mode: 'HTML' })
                }
            }
        }
    } catch (error) {
        console.error('Error fetching or sending metrics:', error)
        await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Error fetching or sending metrics\n<code>${error}</code>`, { parse_mode: 'HTML' })
    }
}

// Функция для отправки сообщений администраторам
// async function metricsNotification(ctx, index) {
//     await sendMetricsMessages('dir', formatMetricsMessage, ctx)
// }

// Функция для отправки сообщений начальникам производства
async function metricsNotificationProiz(ctx, index) {
    // await sendMetricsMessages('nach_frez', formatMetricsMessageFrez, ctx)
    // await sendMetricsMessages('nach_toc', formatMetricsMessageToc, ctx)
    await formatMetricsMessageMaster(ctx, index)
}

async function formatMetricsMessageMaster() {
    try {
        const metricsMasterData = await getMetricsMaster();

        console.log('Metrics master data:', metricsMasterData);

        if (!Array.isArray(metricsMasterData.metrics_master)) {
            throw new Error('Metrics master data is not an array');
        }

        for (const metrics of metricsMasterData.metrics_master) {
            const brakInfo = metrics.kpi_brak !== 0 ? `<b>Брак:</b> <code>${metrics.kpi_brak.toFixed(2)}</code>` : '';

            const message =
                `${emoji.star} Смена: ${metrics.smena} ` +
                `<u><b>Место в рейтинге: ${metrics.rating_pos}</b></u>\n` +
                `<b>ЦКП:</b> <code>${metrics.kpi.toFixed(2)}</code>\n` +
                `${brakInfo}`;

            await sleep(1000);

            try {
                await bot.telegram.sendMessage(metrics.user_id, message, { parse_mode: 'HTML' });
                await bot.telegram.sendMessage(LOG_CHANNEL_ID, await getUserLinkById(metrics.user_id) + '\n' + message, { parse_mode: 'HTML' });

                console.log(`Metrics message sent successfully to userId:`, metrics.user_id);
            } catch (error) {
                console.error(`Failed to send message to userId:`, metrics.user_id, 'Error:', error);
                await bot.telegram.sendMessage(LOG_CHANNEL_ID, `Не удалось отправить сообщение <code>${metrics.user_id}</code>\n<code>${error}</code>`, { parse_mode: 'HTML' });
            }
        }
    } catch (error) {
        console.error('Error formatting metrics master message:', error);
        return 'Error formatting metrics master message';
    }
}


module.exports = { metricsNotification, metricsNotificationProiz }


