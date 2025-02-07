const assert = require('assert');

const constants = require('@sogebot/ui-helpers/constants');
const { dayjs } = require('@sogebot/ui-helpers/dayjsHelper');
const { getRepository } = require('typeorm');

const { User } = require('../../../dest/database/entity/user');
const { getOwner } = require('../../../dest/helpers/commons/getOwner');
const { prepare } = require('../../../dest/helpers/commons/prepare');
const twitch = require('../../../dest/services/twitch.js').default;
const top = (require('../../../dest/systems/top')).default;
const db = require('../../general.js').db;
const message = require('../../general.js').message;

// users
const owner = { userName: '__broadcaster__' };

describe('Top - !top subage - @func1', () => {
  before(async () => {
    await db.cleanup();
    await message.prepare();
  });

  it ('Add 10 users into db and last user will don\'t have any subage', async () => {
    for (let i = 0; i < 10; i++) {
      await getRepository(User).save({
        userId:       String(Math.floor(Math.random() * 100000)),
        userName:     'user' + i,
        isSubscriber: true,
        subscribedAt: new Date(Date.now() - (constants.HOUR * i)).toISOString(),
      });
    }
  });

  it ('Add user with long subage but not subscriber', async () => {
    await getRepository(User).save({
      userId:       String(Math.floor(Math.random() * 100000)),
      userName:     'user11',
      isSubscriber: false,
      subscribedAt: new Date(Date.now() - (constants.HOUR * 24 * 30)).toISOString(),
    });
  });

  it('run !top subage and expect correct output', async () => {
    const r = await top.subage({ sender: { userName: getOwner() } });
    const dates = [];
    for (let i = 0; i < 10; i++) {
      dates.push(`${dayjs.utc(Date.now() - (constants.HOUR * i)).format('L')} (${dayjs.utc(Date.now() - (constants.HOUR * i)).fromNow()})`);
    }
    assert.strictEqual(r[0].response, `Top 10 (subage): 1. @user9 - ${dates[9]}, 2. @user8 - ${dates[8]}, 3. @user7 - ${dates[7]}, 4. @user6 - ${dates[6]}, 5. @user5 - ${dates[5]}, 6. @user4 - ${dates[4]}, 7. @user3 - ${dates[3]}, 8. @user2 - ${dates[2]}, 9. @user1 - ${dates[1]}, 10. @user0 - ${dates[0]}`, owner);
  });

  it('add user0 to ignore list', async () => {
    const r = await twitch.ignoreAdd({ sender: owner, parameters: 'user0' });
    assert.strictEqual(r[0].response, prepare('ignore.user.is.added' , { userName: 'user0' }));
  });

  it('run !top subage and expect correct output', async () => {
    const r = await top.subage({ sender: { userName: getOwner() } });
    const dates = [];
    for (let i = 0; i < 10; i++) {
      dates.push(`${dayjs.utc(Date.now() - (constants.HOUR * i)).format('L')} (${dayjs.utc(Date.now() - (constants.HOUR * i)).fromNow()})`);
    }
    assert.strictEqual(r[0].response, `Top 10 (subage): 1. @user9 - ${dates[9]}, 2. @user8 - ${dates[8]}, 3. @user7 - ${dates[7]}, 4. @user6 - ${dates[6]}, 5. @user5 - ${dates[5]}, 6. @user4 - ${dates[4]}, 7. @user3 - ${dates[3]}, 8. @user2 - ${dates[2]}, 9. @user1 - ${dates[1]}`, owner);
  });
});
