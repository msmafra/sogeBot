/* global describe it beforeEach */
require('../../general.js');

const assert = require('assert');

const _ = require('lodash');
const { getRepository } = require('typeorm');

const { User } = require('../../../dest/database/entity/user');
const cooldown = (require('../../../dest/systems/cooldown')).default;
const db = require('../../general.js').db;
const message = require('../../general.js').message;
const url = require('../../general.js').url;

// users
const owner = {
  userId: String(Math.floor(Math.random() * 100000)), badges: {}, userName: '__broadcaster__',
};
const follower = {
  badges: {}, userName: 'follower', userId: String(_.random(999999, false)), isFollower: true,
};
const commonUser = {
  badges: {}, userName: 'user1', userId: String(_.random(999999, false)),
};
const commonUser2 = {
  badges: {}, userName: 'user2', userId: String(_.random(999999, false)),
};

describe('Cooldowns - toggleFollowers() - @func3', () => {
  beforeEach(async () => {
    await db.cleanup();
    await message.prepare();
    await getRepository(User).save(follower);
    await getRepository(User).save(commonUser);
    await getRepository(User).save(commonUser2);
  });

  it('incorrect toggle', async () => {
    const [command, type, seconds, quiet] = ['!me', 'user', '60', true];
    const r = await cooldown.main({ sender: owner, parameters: `${command} ${type} ${seconds} ${quiet}` });
    const r2 = await cooldown.toggleFollowers({ sender: owner, parameters: command });

    assert.strictEqual(r[0].response, '$sender, user cooldown for !me was set to 60s');
    assert.strictEqual(r2[0].response, 'Usage => ' + url + '/systems/cooldowns');
  });

  it('correct toggle - follower user', async () => {
    const [command, type, seconds, quiet] = ['!me', 'user', '60', true];
    const r = await cooldown.main({ sender: owner, parameters: `${command} ${type} ${seconds} ${quiet}` });
    const r2 = await cooldown.toggleFollowers({ sender: owner, parameters: `${command} ${type}` });

    assert.strictEqual(r[0].response, '$sender, user cooldown for !me was set to 60s');
    assert.strictEqual(r2[0].response, '$sender, cooldown for !me was disabled for followers');

    let isOk = await cooldown.check({ sender: follower, message: '!me' });
    assert(isOk);
    isOk = await cooldown.check({ sender: follower, message: '!me' });
    assert(isOk);

    const r3 = await cooldown.toggleFollowers({ sender: owner, parameters: `${command} ${type}` });
    assert.strictEqual(r3[0].response, '$sender, cooldown for !me was enabled for followers');

    isOk = await cooldown.check({ sender: follower, message: '!me' });
    assert(isOk);
    isOk = await cooldown.check({ sender: follower, message: '!me' });
    assert(!isOk);
  });

  it('correct toggle - common user', async () => {
    const [command, type, seconds, quiet] = ['!me', 'user', '60', true];
    const r = await cooldown.main({ sender: owner, parameters: `${command} ${type} ${seconds} ${quiet}` });
    assert.strictEqual(r[0].response, '$sender, user cooldown for !me was set to 60s');

    let isOk = await cooldown.check({ sender: commonUser, message: '!me' });
    assert(isOk);
    isOk = await cooldown.check({ sender: commonUser, message: '!me' });
    assert(!isOk);

    const r2 = await cooldown.toggleFollowers({ sender: owner, parameters: `${command} ${type}` });
    assert.strictEqual(r2[0].response, '$sender, cooldown for !me was disabled for followers');

    isOk = await cooldown.check({ sender: commonUser, message: '!me' });
    assert(!isOk);
    isOk = await cooldown.check({ sender: commonUser, message: '!me' });
    assert(!isOk);
  });

  it('correct toggle - common user2', async () => {
    const [command, type, seconds, quiet] = ['!me', 'user', '60', true];
    const r = await cooldown.main({ sender: owner, parameters: `${command} ${type} ${seconds} ${quiet}` });
    assert.strictEqual(r[0].response, '$sender, user cooldown for !me was set to 60s');

    let isOk = await cooldown.check({ sender: commonUser2, message: '!me' });
    assert(isOk);
    isOk = await cooldown.check({ sender: commonUser2, message: '!me' });
    assert(!isOk);

    const r2 = await cooldown.toggleFollowers({ sender: owner, parameters: `${command} ${type}` });
    assert.strictEqual(r2[0].response, '$sender, cooldown for !me was disabled for followers');

    isOk = await cooldown.check({ sender: commonUser2, message: '!me' });
    assert(!isOk);
    isOk = await cooldown.check({ sender: commonUser2, message: '!me' });
    assert(!isOk);
  });
});
