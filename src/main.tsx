import { defineComponent, createApp, Suspense, ref } from "vue";
import { useStore } from "./useStore";
import { isReady } from "./utils";

const App = defineComponent(async () => {
  const store = useStore("test");
  await isReady(store);

  const newLabel = ref("");

  return () => (
    <ul>
      {Object.keys(store).map((key) => (
        <li>
          <label>
            key
            <input value={key} readonly />
          </label>
          <label>
            value
            <input v-model={store[key]} />
          </label>
        </li>
      ))}
      <li>
        <input v-model={newLabel.value} />
        <button onClick={() => (store[newLabel.value] = newLabel.value = "")}>
          Add New
        </button>
      </li>
    </ul>
  );
});

createApp(() => (
  <Suspense
    v-slots={{
      fallback: () => <div>Loading...</div>,
    }}
  >
    <App />
  </Suspense>
)).mount("#app");
