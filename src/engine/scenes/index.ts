/**
 * Every scene the game can play, registered by being imported.
 *
 * The runtime in `systems/scenes` knows nothing about any of them; each one
 * calls `defineScene` when its module loads, and the engine imports this file
 * before any command can ask for a scene by name.
 */

import './activity';
import './closing';
import './compose';
import './counter';
import './date';
import './dress';
import './dealer';
import './flight';
import './gym';
import './inspection';
import './meal';
import './movein';
import './run';
import './shop';
import './viewing';
import './visit';
