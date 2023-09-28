const cron = require('node-cron')
const { notifyAllUsers } = require('#src/modules/notify')
const { oplataNotification } = require('#src/modules/oplata')
const { checkBotData } = require('#src/api/index')
const { format } = require('date-fns') // импортируйте функцию format

function initCronJobs(currentDateTime, instanceNumber) {
    // Уведомлять о сообщениях каждые 15 мин
    cron.schedule('*/15 8-23 * * *', async () => {
        console.log('notifyAllUsers Running a task every 15 minutes')
        await notifyAllUsers(ctx)
    })

    // Уведомлять об ОПЛАТЕ каждые 6 мин
    cron.schedule('*/6 * * * *', async () => {
        await oplataNotification()
    })

    if (MODE === 'build') {
        // Проверка экземпляра
        cron.schedule('*/3 * * * *', async () => {
            stateCounter.bot_check++

            // Получаем текущую дату и время
            const formattedDateTime = format(currentDateTime, 'yyyy-MM-dd HH:mm:ss')
            console.log('formattedDateTime=', formattedDateTime, 'instanceNumber=', instanceNumber)

            try {
                const response = await checkBotData(formattedDateTime, instanceNumber)
                console.log('Данные о актуальном экземляре:', response.latest_entry)

                // Проверяем соответствие
                if (formattedDateTime !== response.data.latest_entry.date || instanceNumber !== response.data.latest_entry.random_key) {
                    console.error('Несоответствие данных! Останавливаем бота.')
                    await bot.telegram.sendMessage(LOG_CHANNEL_ID, emoji.x + 'Несоответствие данных! Останавливаем бота.', { parse_mode: 'HTML' })
                    // Сначала останавливаем бота
                    bot.stop()
                    // Затем завершаем весь процесс
                    process.exit()
                }
            } catch (error) {
                console.error('Ошибка данных о актуальном экземляре:', error)
            }
        })
    }
}

module.exports = { initCronJobs }
