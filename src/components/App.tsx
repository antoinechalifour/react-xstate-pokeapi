import React from "react";
import { Machine, assign } from "xstate";
import { useMachine } from "@xstate/react";
import styled from "styled-components";

// ------------------------------------------------- //
// Type defs
// ------------------------------------------------- //

interface Pokemon {
  id: number;
  name: string;
  sprite: string;
  type: string;
}

interface Context {
  pokemon: Pokemon | null;
  background: string;
}

// ------------------------------------------------- //
// Helper functions
// ------------------------------------------------- //

const mapPokemon = (apiPokemon: any): Pokemon => ({
  id: apiPokemon.id,
  name: apiPokemon.name,
  sprite: apiPokemon.sprites.front_default,
  type: apiPokemon.types[0].type.name
});

const preloadSprite = (pokemon: Pokemon) =>
  new Promise(resolve => {
    const sprite = new Image();

    const next = () => resolve(pokemon);

    sprite.onload = next;
    sprite.onerror = next;
    sprite.src = pokemon.sprite;
  });

const fetchRandomPokemon = () =>
  fetch(`https://pokeapi.co/api/v2/pokemon/${Math.floor(Math.random() * 890)}`)
    .then(response => response.json())
    .then(mapPokemon)
    .then(preloadSprite);

const fetchRandomPokemonWithForcedDelay = () =>
  fetchRandomPokemon().then(
    pokemon => new Promise(resolve => setTimeout(() => resolve(pokemon), 2000))
  );

const getBackground = (pokemon: Pokemon) => {
  switch (pokemon.type) {
    case "normal":
      return "#fff";
    case "fairy":
      return "#df87ff";
    case "water":
      return "#87d0ff";
    case "psychic":
      return "#ee8fee";
    case "poison":
    case "flying":
      return "#e6e5e4";
    case "ice":
      return "#a9fff9";
    case "fire":
      return "#ff7c7c";
    case "rock":
      return "#ffb982";
    case "dragon":
      return "#9187ff";
    case "ghost":
      return "#e2b8ff";
    case "fighting":
      return "#7cff83";
    case "grass":
      return "#7cff83";
    case "dark":
      return "#b5b5b5";
    case "steel":
      return "#e8e8e8";
    case "electric":
      return "#fffaa4";
    case "bug":
      return "#a4ffa9";
    case "ground":
      return "#ffd8a4";
    default:
      return "red";
  }
};

// ------------------------------------------------- //
// Styling stuff
// ------------------------------------------------- //

const Background = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  transition: background 0.2s ease;
`;

const Button = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.65);
  padding: 12px 24px;
  font-size: inherit;
  font-family: inherit;
  border-radius: 2px;
  cursor: pointer;
  transform: scale(1);
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
`;

const Text = styled.p`
  font-size: 1.2rem;
  margin: 16px 0;
`;

const PokemonName = styled.h1`
  font-size: 2.5rem;
  margin: 16px 0;
`;

const Sprite = styled.img`
  width: 80%;
  max-width: 350px;
`;

// ------------------------------------------------- //
// Final screens
// ------------------------------------------------- //

const IntroScreen: React.FC<{ start: () => void }> = ({ start }) => (
  <Button onClick={start}>Click to discover your totem pokemon</Button>
);

const LoadingScreen: React.FC<{ abort: () => void }> = ({ abort }) => (
  <>
    <Text>Loading your totem pokemon...</Text>
    <Button onClick={abort}>Abort search</Button>
  </>
);

const PokemonScreen: React.FC<{ pokemon: Pokemon; reload: () => void }> = ({
  pokemon,
  reload
}) => (
  <>
    <Text>Your totem pokemon is...</Text>
    <PokemonName>
      {pokemon.name} (#{pokemon.id})
    </PokemonName>
    <Sprite src={pokemon.sprite} alt={`${pokemon.name} sprite`} />
    <Button onClick={reload}>Change your totem pokemon</Button>
  </>
);

const ErrorScreen: React.FC<{ reload: () => void }> = ({ reload }) => (
  <>
    <Text>An error occured...</Text>
    <Button onClick={reload}>Retry</Button>
  </>
);

// ------------------------------------------------- //
// App logic
// ------------------------------------------------- //

const pokemonMachine = Machine<Context>({
  id: "random-pokemon-machine",
  initial: "iddle",
  context: {
    pokemon: null,
    background: "#f6f6f6"
  },
  states: {
    iddle: {
      on: { LOAD: "loading" }
    },
    loading: {
      on: {
        ABORT: "iddle"
      },
      invoke: {
        id: "fetch-pokemon",
        src: fetchRandomPokemonWithForcedDelay,
        onDone: {
          target: "showPokemon",
          actions: assign({
            pokemon: (ctx, event) => event.data,
            background: (ctx, event) => getBackground(event.data)
          })
        },
        onError: "showError"
      }
    },
    showPokemon: {
      on: { LOAD: "loading" }
    },
    showError: {
      on: { LOAD: "loading" }
    }
  }
});

// ------------------------------------------------- //
// App
// ------------------------------------------------- //

export interface AppProps {}

export const App: React.FC<AppProps> = () => {
  const [state, send] = useMachine(pokemonMachine);
  const { context } = state;

  return (
    <Background style={{ background: context.background }}>
      {(() => {
        switch (true) {
          case state.matches("iddle"):
            return <IntroScreen start={() => send("LOAD")} />;

          case state.matches("loading"):
            return <LoadingScreen abort={() => send("ABORT")} />;

          case state.matches("showPokemon"):
            return (
              <PokemonScreen
                pokemon={context.pokemon!}
                reload={() => send("LOAD")}
              />
            );

          case state.matches("showError"):
            return <ErrorScreen reload={() => send("LOAD")} />;

          default:
            throw new Error(`Unknown state: ${state.value}`);
        }
      })()}
    </Background>
  );
};
