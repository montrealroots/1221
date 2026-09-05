/**
 * Every scene the game can play, registered by being imported.
 *
 * The runtime in `systems/scenes` knows nothing about any of them; each one
 * calls `defineScene` when its module loads, and the engine imports this file
 * before any command can ask for a scene by name.
 */

import './activity';
import './gym';
import './meal';
import './run';
